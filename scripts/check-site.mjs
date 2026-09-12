import assert from "node:assert/strict";

const base = new URL(process.argv[2] || "http://127.0.0.1:3107");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) {
  throw new Error("This smoke test only runs against a local server.");
}

const routes = ["/", "/asesoria-transportes", "/formacion-cap", "/autoescuela-takcanarias", "/clases-de-apoyo", "/contacto", "/deca", "/cursos", "/area-cliente", "/descarga-tarjeta", "/plataforma-gps", "/politica-privacidad", "/aviso-legal", "/blog"];
const internalLinks = new Set();
const titles = new Set();
for (const route of routes) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${route}: one h1`);
  assert.match(html, /<html[^>]*lang="es"/, `${route}: Spanish`);
  assert.match(html, /name="robots" content="noindex, follow"/, `${route}: preview noindex`);
  assert.match(html, /rel="canonical"/, `${route}: canonical`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title && !titles.has(title), `${route}: unique title`);
  titles.add(title);
  for (const match of html.matchAll(/<a\b[^>]*href="(\/[^"#]*)(?:#[^"]*)?"/g)) internalLinks.add(match[1]);
  if (["/deca", "/cursos", "/area-cliente"].includes(route)) {
    assert.match(html, /En preparación/, `${route}: explicit unavailable state`);
    assert.doesNotMatch(html, /<form\b/, `${route}: no fake login`);
  }
  assert.doesNotMatch(html, /https:\/\/www\.my-fis\.com/, `${route}: obsolete VDO URL removed`);
  if (["/", "/asesoria-transportes", "/descarga-tarjeta", "/area-cliente"].includes(route)) {
    assert.match(html, /href="https:\/\/tachomat\.app\.vdo-fleet\.com\/connect\/insert-card"/, `${route}: direct VDO link`);
    assert.match(html, /Descargar tarjeta en VDO/, `${route}: labelled VDO action`);
  }
  if (["/", "/contacto"].includes(route)) {
    assert.match(html, /<iframe[^>]+src="https:\/\/maps\.google\.com\/maps\?/, `${route}: map embedded`);
    assert.match(html, /title="Mapa de Takcanarias:/, `${route}: accessible map title`);
  }
  if (route === "/clases-de-apoyo") {
    assert.match(html, /id="metodologia"/, "Support methodology section");
    assert.match(html, /id="asignaturas"/, "Support subjects section");
    for (const text of ["Primaria", "Secundaria / ESO", "Bachillerato", "Inglés", "Tareas y práctica diaria", "Exámenes y hábitos de estudio"]) assert.ok(html.includes(text), text);
  }
  console.log(`PASS ${route}`);
}
for (const path of internalLinks) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `Internal link ${path}`);
}

for (const path of ["/ruta-inexistente", "/pagina-ejemplo", "/_scrape/raw/pages.json", "/docs/integraciones.md"]) {
  assert.equal((await fetch(new URL(path, base))).status, 404, path);
}

for (const [source, destination] of [["/inicio-2", "/"], ["/inicio-3", "/"], ["/404-2", "/"], ["/descarga-tarjetas", "/descarga-tarjeta"], ["/descarga-tarjetas-2", "/descarga-tarjeta"]]) {
  const response = await fetch(new URL(source, base), { redirect: "manual" });
  assert.equal(response.status, 308, source);
  assert.equal(new URL(response.headers.get("location"), base).pathname, destination);
}
const favicon = await fetch(new URL("/favicon.ico", base), { redirect: "manual" });
assert.equal(favicon.status, 307);
assert.equal(favicon.headers.get("location"), "/brand/favicon.png");

const sitemap = await (await fetch(new URL("/sitemap.xml", base))).text();
assert.equal((sitemap.match(/<loc>/g) || []).length, 8);
assert.doesNotMatch(sitemap, /area-cliente|\/deca|\/cursos|politica-privacidad/);
assert.match(await (await fetch(new URL("/robots.txt", base))).text(), /Allow: \//);
console.log(`PASS ${routes.length} pages, ${internalLinks.size} internal destinations, 4 safe 404s, 6 redirects, sitemap and robots.`);
