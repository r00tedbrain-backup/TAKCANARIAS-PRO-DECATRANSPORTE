import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../_scrape/', import.meta.url));
const origin = 'http://www.takcanarias.es/';
const hosts = new Set(['www.takcanarias.es', 'takcanarias.es']);
const startedAt = new Date().toISOString();
const run = path.join(root, 'archive', startedAt.replaceAll(':', '-'));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const relative = (file) => path.relative(root, file);
const manifest = {
  startedAt, origin, concurrency: 3,
  scope: 'Public unauthenticated GET only; no external requests or form submissions. Not a database/plugin backup.',
  rights: 'Public availability does not establish ownership, license, consent, or permission to reuse.',
  existingFiles: [], requests: [], pagination: {}, collections: {}, links: [], contactText: [], excluded: [], errors: [],
};

function decode(text) {
  return text.replace(/&#(x[\da-f]+|\d+);/gi, (whole, code) => {
    const value = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : whole;
  }).replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, name) => ({
    amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  })[name]);
}

function resolveUrl(value, base = origin) {
  try {
    const url = new URL(decode(value), base);
    url.hash = '';
    return url;
  } catch { return null; }
}

function allowed(url) {
  return url && hosts.has(url.hostname) && ['http:', 'https:'].includes(url.protocol)
    && !url.username && !url.password && !url.port;
}

function publicUrl(url) {
  if (!allowed(url) || /\/(?:wp-admin|wp-login\.php|wp-comments-post\.php|xmlrpc\.php|author)(?:\/|$)/i.test(url.pathname)) return false;
  if (url.searchParams.has('context') && url.searchParams.get('context') !== 'view') return false;
  return [...url.searchParams.keys()].every((key) => ['page', 'paged', 'p', 'page_id', 'cat', 'tag', 'per_page', 'context', 'rest_route'].includes(key));
}

function imageMime(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (/^GIF8[79]a/.test(buffer.toString('ascii', 0, 6))) return 'image/gif';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(buffer.toString('ascii', 8, 32))) return 'image/avif';
  if (buffer.toString('ascii', 0, 2) === 'BM') return 'image/bmp';
  if (buffer.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) return 'image/x-icon';
  const text = buffer.toString('utf8', 0, 4096).trimStart();
  if (/^(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->\s*)?<svg\b/i.test(text) && !/<html\b/i.test(text)) return 'image/svg+xml';
  return null;
}

async function save(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data, { flag: 'wx' });
  return { file: relative(file), bytes: Buffer.byteLength(data), sha256: sha256(data) };
}

async function pool(items, action) {
  let index = 0;
  return Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => {
    while (index < items.length) await action(items[index++]);
  }));
}

async function capture(url, kind, name) {
  const entry = { url, kind, fetchedAt: new Date().toISOString(), redirects: [], ok: false };
  manifest.requests.push(entry);
  try {
    let current = resolveUrl(url);
    for (let hop = 0; hop <= 8; hop++) {
      if (!publicUrl(current)) throw new Error(`Blocked URL: ${current}`);
      const response = await fetch(current, {
        redirect: 'manual', signal: AbortSignal.timeout(45000),
        headers: { 'User-Agent': 'TAKCanarias-PublicArchive/1.0 (public migration archive)', Referer: origin },
      });
      entry.finalUrl = current.href;
      entry.status = response.status;
      entry.headers = Object.fromEntries(['content-type', 'content-length', 'content-encoding', 'location', 'link', 'x-wp-total', 'x-wp-totalpages', 'last-modified', 'etag', 'date']
        .map((key) => [key, response.headers.get(key)]).filter(([, value]) => value !== null));
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const next = resolveUrl(response.headers.get('location') ?? '', current);
        entry.redirects.push({ url: current.href, status: response.status, location: response.headers.get('location'), allowed: publicUrl(next) });
        await response.body?.cancel();
        if (!response.headers.has('location') || !publicUrl(next)) throw new Error(`Blocked or invalid redirect: ${next}`);
        current = next;
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      entry.bytes = buffer.length;
      entry.sha256 = sha256(buffer);
      entry.detectedImageMime = imageMime(buffer);
      const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
      let error = response.ok ? null : `HTTP ${response.status}`;
      const normalizedType = contentType === 'image/jpg' ? 'image/jpeg' : contentType === 'image/vnd.microsoft.icon' ? 'image/x-icon' : contentType;
      if (!error && kind === 'image' && (!entry.detectedImageMime || normalizedType !== entry.detectedImageMime)) error = `Invalid image: header=${contentType}, signature=${entry.detectedImageMime}`;
      if (!error && kind === 'html' && !['text/html', 'application/xhtml+xml'].includes(contentType)) error = `Expected HTML, got ${contentType}`;
      if (!error && kind === 'json') {
        if (!contentType.includes('json')) error = `Expected JSON, got ${contentType}`;
        else { try { JSON.parse(buffer.toString()); } catch { error = 'Invalid JSON'; } }
      }
      const file = path.join(run, error ? 'errors' : kind, name);
      Object.assign(entry, await save(file, buffer));
      if (error) throw new Error(error);
      entry.ok = true;
      return { entry, buffer };
    }
    throw new Error('Redirect limit exceeded');
  } catch (error) {
    entry.error = { message: error.message, cause: error.cause?.message, code: error.cause?.code ?? error.code };
    manifest.errors.push({ url, kind, ...entry.error });
    return { entry, buffer: null };
  }
}

const media = new Map();
const documents = new Map();
const seenDocuments = new Set();
const excluded = new Set();
const imageExtension = /\.(?:jpe?g|png|gif|webp|avif|svg|ico|bmp)(?:$|\?)/i;

function enqueueMedia(value, source, expectedMime) {
  const url = resolveUrl(value, source);
  if (!allowed(url)) {
    if (url && !excluded.has(url.href)) {
      excluded.add(url.href);
      manifest.excluded.push({ url: url.href, source, reason: 'External asset; recorded, not requested' });
    }
    return;
  }
  const item = media.get(url.href) ?? { url: url.href, sources: [], expectedMime: expectedMime ?? (imageExtension.test(url.href) ? 'image/unknown' : null) };
  if (!item.sources.includes(source)) item.sources.push(source);
  media.set(url.href, item);
}

function enqueueDocument(value, source) {
  const url = resolveUrl(value, source);
  if (!publicUrl(url) || /\/(?:wp-json|wp-content|wp-includes|feed)(?:\/|$)|\.(?:xml|json|php)$/i.test(url.pathname)) return;
  if (/\.[a-z\d]{2,5}$/i.test(url.pathname) && !/\.html?$/i.test(url.pathname)) {
    enqueueMedia(url.href, source);
    return;
  }
  if (!seenDocuments.has(url.href)) documents.set(url.href, source);
}

function inspectHtml(html, source, file) {
  const clean = html.replace(/<(script|style)\b[^>]*>[^]*?<\/\1>/gi, (value) => value.replace(/[^\n]/g, ' '));
  for (const match of clean.matchAll(/<a\b([^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*)>([^]*?)<\/a>/gi)) {
    const href = decode(match[2] ?? match[3] ?? match[4]);
    const label = decode(match[5].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
    const resolved = resolveUrl(href, source);
    const menuItem = clean.slice(0, match.index).match(/<li\b[^>]*class=["'][^"']*menu-item[^"']*["'][^>]*>\s*$/i)?.[0];
    manifest.links.push({ source, file, line: html.slice(0, match.index).split('\n').length, href, url: resolved?.href ?? href, label, menu: Boolean(menuItem), external: resolved ? !allowed(resolved) : true });
    if (href && !href.startsWith('#')) enqueueDocument(href, source);
  }
  for (const match of clean.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const url = resolveUrl(match[1], source);
    manifest.links.push({ source, file, line: html.slice(0, match.index).split('\n').length, href: decode(match[1]), url: url?.href, label: 'Embedded frame (not requested)', menu: false, external: !allowed(url) });
  }
  for (const match of clean.matchAll(/>([^<>]+)</g)) {
    const text = decode(match[1]).replace(/\s+/g, ' ').trim();
    if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:^|\s)(?:\+34\s*)?[689](?:[\s.-]?\d){8}(?:$|\s)/i.test(text)) {
      manifest.contactText.push({ source, file, line: html.slice(0, match.index).split('\n').length, text });
    }
  }
  for (const match of html.matchAll(/\b(?:src|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) {
    if (imageExtension.test(match[1]) || /\/uploads\//.test(match[1])) enqueueMedia(match[1], source);
  }
  for (const match of html.matchAll(/\b(?:srcset|data-srcset)\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',')) enqueueMedia(candidate.trim().split(/\s+/)[0], source);
  }
  for (const match of html.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) {
    if (imageExtension.test(match[1])) enqueueMedia(match[1], source);
  }
}

async function main() {
  // Inventory the prior capture, without copying private source material into this run.
  async function inventory(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.name === 'archive') continue;
      const file = path.join(directory, item.name);
      if (item.isDirectory()) await inventory(file);
      else if (item.isFile()) {
        const buffer = await readFile(file);
        manifest.existingFiles.push({ file: relative(file), bytes: buffer.length, sha256: sha256(buffer), detectedImageMime: imageMime(buffer) });
      }
    }
  }
  await inventory(root);
  await mkdir(run, { recursive: true });
  const collections = {};
  for (const type of ['pages', 'posts', 'media', 'categories', 'tags']) {
    const rows = [];
    const evidence = { perPage: 20, pages: [], errors: [] };
    manifest.pagination[type] = evidence;
    async function page(number) {
      const result = await capture(`${origin}wp-json/wp/v2/${type}?per_page=20&page=${number}&context=view`, 'json', `${type}-${number}.json`);
      const data = result.buffer ? JSON.parse(result.buffer.toString()) : null;
      const total = Number(result.entry.headers?.['x-wp-total']);
      const totalPages = Number(result.entry.headers?.['x-wp-totalpages']);
      evidence.pages.push({ page: number, url: result.entry.url, file: result.entry.file, total, totalPages, count: Array.isArray(data) ? data.length : null });
      if (!Array.isArray(data) || !Number.isInteger(totalPages) || totalPages < 0 || !Number.isInteger(total) || total < 0) {
        evidence.errors.push(`Invalid collection or pagination headers on page ${number}`);
        return null;
      }
      rows.push(...data);
      return { total, totalPages };
    }
    const first = await page(1);
    if (first) await pool(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => i + 2), page);
    evidence.pages.sort((a, b) => a.page - b.page);
    rows.sort((a, b) => a.id - b.id);
    const uniqueIds = new Set(rows.map((row) => row.id));
    evidence.uniqueIds = uniqueIds.size;
    evidence.complete = Boolean(first && uniqueIds.size === first.total && rows.length === uniqueIds.size
      && evidence.pages.length === Math.max(1, first.totalPages) && !evidence.errors.length
      && evidence.pages.every((item) => item.total === first.total && item.totalPages === first.totalPages));
    collections[type] = rows;
    manifest.collections[type] = { count: rows.length, ...await save(path.join(run, 'collections', `${type}.json`), JSON.stringify(rows, null, 2)) };
    console.log(`${type}: ${uniqueIds.size}/${first?.total ?? '?'}; pagination complete=${evidence.complete}`);
  }

  for (const item of collections.media) {
    const source = `${origin}wp-json/wp/v2/media/${item.id}`;
    enqueueMedia(item.source_url, source, item.mime_type);
    for (const size of Object.values(item.media_details?.sizes ?? {})) {
      if (size.source_url) enqueueMedia(size.source_url, source, size.mime_type);
    }
    if (item.media_details?.original_image && item.source_url) enqueueMedia(new URL(item.media_details.original_image, item.source_url).href, source, item.mime_type);
    enqueueDocument(item.link, origin);
  }
  for (const type of ['pages', 'posts', 'categories', 'tags']) {
    for (const item of collections[type]) {
      enqueueDocument(item.link, origin);
    }
  }
  enqueueDocument(origin, origin);

  await pool(['https://www.takcanarias.es/', 'https://takcanarias.es/'], async (url) => {
    await capture(url, 'html', `https-${new URL(url).hostname}.html`);
  });

  const sitemapQueue = new Set([`${origin}wp-sitemap.xml`, `${origin}sitemap_index.xml`]);
  const robots = await capture(`${origin}robots.txt`, 'discovery', 'robots.txt');
  for (const match of (robots.buffer?.toString() ?? '').matchAll(/^Sitemap:\s*(\S+)/gim)) {
    if (allowed(resolveUrl(match[1]))) sitemapQueue.add(match[1]);
  }
  const seenSitemaps = new Set();
  while (sitemapQueue.size) {
    const batch = [...sitemapQueue];
    sitemapQueue.clear();
    await pool(batch, async (url) => {
      if (seenSitemaps.has(url)) return;
      seenSitemaps.add(url);
      const result = await capture(url, 'discovery', `sitemap-${sha256(url).slice(0, 16)}.xml`);
      const xml = result.buffer?.toString() ?? '';
      if (!/<(?:sitemapindex|urlset)\b/.test(xml)) return;
      for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
        const link = resolveUrl(match[1].trim(), url);
        if (!publicUrl(link)) continue;
        // Do not enumerate author/user sitemaps or profiles.
        if (/users|authors|\/author\//i.test(link.href)) continue;
        if (/<sitemapindex\b/.test(xml)) {
          if (!seenSitemaps.has(link.href)) sitemapQueue.add(link.href);
        } else enqueueDocument(link.href, url);
      }
    });
  }

  while (documents.size) {
    const batch = [...documents];
    documents.clear();
    await pool(batch, async ([url, source]) => {
      if (seenDocuments.has(url) || /\/author\//i.test(new URL(url).pathname)) return;
      seenDocuments.add(url);
      const slug = new URL(url).pathname.replace(/[^a-z\d_-]/gi, '-').slice(0, 90) || 'home';
      const result = await capture(url, 'html', `${slug}-${sha256(url).slice(0, 16)}.html`);
      result.entry.discoveredFrom = source;
      if (result.buffer) inspectHtml(result.buffer.toString(), result.entry.finalUrl, result.entry.file);
    });
    console.log(`HTML: ${seenDocuments.size} fetched; ${documents.size} pending; ${media.size} media URLs`);
  }

  await pool([...media.values()], async (item) => {
    const url = new URL(item.url);
    const basename = path.posix.basename(url.pathname).replace(/[^a-z\d._-]/gi, '_').slice(-130) || 'asset';
    const kind = item.expectedMime?.startsWith('image/') ? 'image' : 'media';
    const result = await capture(item.url, kind, `${sha256(item.url).slice(0, 16)}-${basename}`);
    Object.assign(result.entry, { discoveredFrom: item.sources, expectedMime: item.expectedMime });
    if (result.entry.ok && kind === 'image' && item.expectedMime !== 'image/unknown' && result.entry.detectedImageMime !== item.expectedMime) result.entry.mimeWarning = 'Signature differs from REST MIME; inspect before reuse';
  });
  manifest.mediaItems = collections.media.map((item) => ({
    id: item.id, title: item.title?.rendered, url: item.source_url,
    archived: manifest.requests.some((entry) => entry.url === item.source_url && entry.ok),
  }));
  const uniqueLinks = new Map();
  for (const link of manifest.links) {
    const key = `${link.source}|${link.href}|${link.label}|${link.menu}`;
    if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
  }
  manifest.links = [...uniqueLinks.values()];
  manifest.finishedAt = new Date().toISOString();
  manifest.summary = {
    enumeratedMedia: manifest.mediaItems.length,
    archivedOriginals: manifest.mediaItems.filter((item) => item.archived).length,
    mediaUrls: media.size,
    downloadedMedia: manifest.requests.filter((entry) => ['image', 'media'].includes(entry.kind) && entry.ok).length,
    html: manifest.requests.filter((entry) => entry.kind === 'html' && entry.ok).length,
    bytes: manifest.requests.reduce((sum, entry) => sum + (entry.bytes ?? 0), 0),
    failedRequests: manifest.errors.length,
    completePagination: Object.values(manifest.pagination).every((item) => item.complete),
  };
  await save(path.join(run, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const cell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
  const homeFirst = [...manifest.links].sort((a, b) => Number(b.source === origin) - Number(a.source === origin));
  const menu = [...new Map(homeFirst.filter((link) => link.menu).reverse().map((link) => [`${link.label}|${link.href}`, link])).values()].reverse();
  const business = [...new Map(manifest.links.filter((link) => {
    if (!link.href || link.href.startsWith('#')) return false;
    const url = resolveUrl(link.href, link.source);
    return url && (/^(?:mailto:|tel:)$/.test(url.protocol) || url.pathname === '/contacto/'
      || /(?:^|\.)(?:app-gps\.es|my-fis\.com|instagram\.com|facebook\.com|twitter\.com|linkedin\.com|wa\.me|whatsapp\.com|google\.com)$/.test(url.hostname));
  }).map((link) => [link.href, link])).values()];
  const contacts = [...new Map(manifest.contactText.map((item) => [item.text, item])).values()];
  const lines = [
    '# Inventario del archivo publico de TAKCANARIAS', '',
    `Captura: ${startedAt}. Fin: ${manifest.finishedAt}.`, '',
    '## Alcance y limites', '',
    'Archivo de respuestas publicas sin autenticacion: REST en context=view, HTML de paginas/entradas/adjuntos/taxonomias y enlaces internos descubiertos, medios originales y tamanos enumerados, imagenes referenciadas en HTML, robots y sitemaps disponibles.',
    'Solo GET a takcanarias.es y www.takcanarias.es (alias del mismo dominio), maximo 3 solicitudes simultaneas. Redirecciones externas bloqueadas antes de seguirlas. Sin submits, cookies, credenciales, usuarios, areas privadas, DB ni backup de plugins. No se ejecuta JavaScript ni se descargan servicios externos. No se garantiza descubrir URLs publicas huerfanas no enumeradas o contenido generado solo por JavaScript.',
    'CSS/JS de temas y plugins no se copian como backup; el HTML conserva sus referencias originales. Las imagenes se verifican por Content-Type y firma binaria; errores HTTP o respuestas HTML se conservan aparte en errors/, nunca como imagen valida. SHA256 y bytes corresponden al cuerpo descomprimido guardado, no al Content-Length comprimido.',
    'Los archivos anteriores se preservan y se registran con hashes en existingFiles. ANALISIS.md contiene tambien notas anteriores ajenas a esta captura: no se usan ni se reproducen como evidencia publica.', '',
    '## Correcciones del analisis anterior', '',
    '- "Sin HTTPS" no es una conclusion valida por observar una pagina HTTP. Se han probado ambos hosts por HTTPS con validacion TLS normal; los resultados exactos figuran abajo y en manifest.json. No se ha desactivado la validacion del certificado.',
    '- "28 reales" era una seleccion local, no una clasificacion de autenticidad, autoria o licencia verificada. Tampoco se acredita que el resto sea exactamente "41 demo/stock". Nombres y apariencia no prueban derechos. Se archivan todos los medios enumerados, incluidos los que parezcan demo o stock, con derechos de reutilizacion pendientes de acreditar.',
    '- Un content.rendered vacio en /plataforma-gps/ no demuestra que falte una plataforma: el menu publicado tiene un enlace externo de AREA CLIENTES. Los enlaces externos se verifican como referencias en el HTML, no como servicios operativos ni cuentas bajo control del negocio.', '',
    '## Cobertura', '',
    '| Coleccion | X-WP-Total | Paginas (per_page=20) | IDs unicos | Completa |', '|---|---:|---:|---:|---|',
    ...Object.entries(manifest.pagination).map(([type, value]) => `| ${type} | ${value.pages[0]?.total} | ${value.pages[0]?.totalPages} | ${value.uniqueIds} | ${value.complete} |`), '',
    `Originales de medios: ${manifest.summary.archivedOriginals}/${manifest.summary.enumeratedMedia}. URLs de medios (incluidas variantes e imagenes HTML): ${manifest.summary.downloadedMedia}/${manifest.summary.mediaUrls}. HTML descargados: ${manifest.summary.html}. Bytes de cuerpos guardados: ${manifest.summary.bytes}. Solicitudes fallidas: ${manifest.summary.failedRequests}.`, '',
    'La evidencia por pagina (URL, cabeceras, total, numero de pagina, cantidad y fichero) esta en pagination y requests de manifest.json. collections/ contiene la union ordenada, sin sustituir raw/ del scrape anterior.', '',
    '## HTTPS', '',
    ...manifest.requests.filter((entry) => entry.url.startsWith('https:')).map((entry) => `- ${entry.url}: ${entry.ok ? `HTTP ${entry.status}` : `${entry.error?.message}; ${entry.error?.cause ?? ''}`} (validacion TLS activa).`), '',
    '## Menu publicado', '',
    '| Texto | href literal | Evidencia HTML |', '|---|---|---|',
    ...menu.map((link) => `| ${cell(link.label)} | ${cell(link.href)} | ${cell(link.file)}:${link.line} |`), '',
    '## Enlaces de negocio', '',
    'Verificados en el contenido descargado; destinos externos NO visitados. Un enlace publicado no demuestra titularidad ni disponibilidad del destino.', '',
    '| Texto | URL literal | Pagina fuente | Evidencia |', '|---|---|---|---|',
    ...business.map((link) => `| ${cell(link.label)} | ${cell(link.href)} | ${cell(link.source)} | ${cell(link.file)}:${link.line} |`), '',
    '## Contacto como texto', '',
    'Texto publico localizado en el HTML. No se convierte en enlaces mailto/tel que no existan en origen ni se comprueba la operatividad de estos canales.', '',
    '| Texto literal | Pagina fuente | Evidencia |', '|---|---|---|',
    ...contacts.map((item) => `| ${cell(item.text)} | ${cell(item.source)} | ${cell(item.file)}:${item.line} |`), '',
    '## Fallos', '',
    ...manifest.errors.map((error) => `- ${error.url}: ${error.message}${error.cause ? `; ${error.cause}` : ''}`),
    ...(manifest.errors.length ? [] : ['Sin fallos registrados en las solicitudes realizadas.']), '',
    '## Reproducir', '',
    '`node scripts/archive-wordpress.mjs` crea otra captura fechada sin sobrescribir archivos. Node.js >=22, solo modulos integrados. No hay dependencias ni credenciales.', '',
  ];
  await save(path.join(run, 'INVENTARIO.md'), lines.join('\n'));
  console.log(JSON.stringify({ directory: relative(run), ...manifest.summary }, null, 2));
}

async function verify(manifestPath) {
  const file = path.resolve(manifestPath);
  if (!file.startsWith(`${root}archive${path.sep}`) || path.basename(file) !== 'manifest.json') throw new Error('Verify requires a manifest under _scrape/archive/');
  const data = JSON.parse(await readFile(file, 'utf8'));
  const failures = [];
  const bodies = new Map();
  for (const entry of [...data.existingFiles, ...data.requests, ...Object.values(data.collections)]) {
    if (!entry.file) continue;
    const target = path.resolve(root, entry.file);
    if (!target.startsWith(root)) throw new Error('Manifest path escapes _scrape');
    const buffer = await readFile(target);
    if (buffer.length !== entry.bytes || sha256(buffer) !== entry.sha256) failures.push(`Hash/size mismatch: ${entry.file}`);
    if (entry.kind === 'image' && entry.ok && (!imageMime(buffer) || imageMime(buffer) !== entry.detectedImageMime)) failures.push(`Invalid image: ${entry.file}`);
    bodies.set(entry.file, buffer);
  }
  const coverage = {};
  for (const [type, evidence] of Object.entries(data.pagination)) {
    const rows = evidence.pages.flatMap((page) => JSON.parse(bodies.get(page.file).toString()));
    const merged = JSON.parse(bodies.get(data.collections[type].file).toString());
    const ids = new Set(rows.map((item) => item.id));
    coverage[type] = { rows: rows.length, uniqueIds: ids.size, pageCounts: evidence.pages.map((page) => JSON.parse(bodies.get(page.file).toString()).length) };
    if (ids.size !== evidence.pages[0].total || rows.length !== ids.size || merged.length !== ids.size
      || merged.some((item) => !ids.has(item.id))) failures.push(`Collection mismatch: ${type}`);
    const pages = evidence.pages.map((page) => page.page);
    if (pages.length !== Math.max(1, evidence.pages[0].totalPages) || pages.some((number, index) => number !== index + 1)) failures.push(`Missing pagination: ${type}`);
  }
  const downloaded = new Set(data.requests.filter((entry) => entry.ok).map((entry) => entry.url));
  for (const type of ['pages', 'posts', 'media', 'categories', 'tags']) {
    const rows = JSON.parse(bodies.get(data.collections[type].file).toString());
    for (const item of rows) {
      if (!downloaded.has(item.link)) failures.push(`Missing HTML: ${item.link}`);
      if (type !== 'media') continue;
      for (const url of [item.source_url, ...Object.values(item.media_details?.sizes ?? {}).map((size) => size.source_url)].filter(Boolean)) {
        if (allowed(resolveUrl(url)) && !downloaded.has(url)) failures.push(`Missing media: ${url}`);
      }
    }
  }
  for (const entry of data.requests) {
    for (const url of [entry.url, entry.finalUrl, ...entry.redirects.map((hop) => hop.url)].filter(Boolean)) {
      if (!publicUrl(resolveUrl(url))) failures.push(`Out of scope: ${url}`);
    }
  }
  for (const link of data.links) {
    const suffix = bodies.get(link.file)?.toString().split('\n').slice(link.line - 1).join('\n') ?? '';
    const firstLineEnd = suffix.indexOf('\n') < 0 ? suffix.length : suffix.indexOf('\n');
    let found = false;
    // The reference line points to the start of a tag, whose attributes may span lines.
    for (const tag of suffix.matchAll(/<(?:a|iframe)\b[^>]*>/gi)) {
      if (tag.index > firstLineEnd) break;
      const attribute = tag[0].match(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (attribute && decode(attribute[1] ?? attribute[2] ?? attribute[3]) === link.href) found = true;
    }
    if (!found) failures.push(`Link evidence mismatch: ${link.file}:${link.line}`);
  }
  for (const url of ['https://example.com/', 'http://www.takcanarias.es.evil.test/', 'http://www.takcanarias.es/wp-login.php', 'http://www.takcanarias.es/?action=delete', 'http://www.takcanarias.es/?context=edit', 'http://user:pass@www.takcanarias.es/', 'http://www.takcanarias.es:8080/', 'file:///etc/passwd']) {
    if (publicUrl(resolveUrl(url))) failures.push(`Guard accepted: ${url}`);
  }
  if (imageMime(Buffer.from('<html>Server error</html>')) || imageMime(Buffer.alloc(0))) failures.push('Image validator accepted HTML/empty body');
  console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), manifest: relative(file), filesVerified: bodies.size, existingFilesUnchanged: data.existingFiles.length, validImages: data.requests.filter((entry) => entry.kind === 'image' && entry.ok).length, uniqueFinalHtmlUrls: new Set(data.requests.filter((entry) => entry.kind === 'html' && entry.ok).map((entry) => entry.finalUrl)).size, redirects: data.requests.flatMap((entry) => entry.redirects), coverage, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

if (process.argv[2] === '--verify') await verify(process.argv[3] ?? '');
else if (process.argv.length > 2) throw new Error('Usage: node scripts/archive-wordpress.mjs [--verify _scrape/archive/<timestamp>/manifest.json]');
else await main();
