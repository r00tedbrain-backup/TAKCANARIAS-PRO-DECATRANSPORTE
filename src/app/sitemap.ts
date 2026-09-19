import type { MetadataRoute } from "next";
import { articulos } from "@/content/blog";
import { services, site } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Prepared for launch; no fabricated modification dates or private routes.
  const paginas = ["", ...services.map(({ slug }) => slug), "contacto", "descarga-tarjeta", "plataforma-gps", "blog"].map(
    (slug) => ({ url: `${site.url}/${slug}` }),
  );

  // Los artículos sí llevan fecha, porque es real y la sabemos: no inventamos
  // una fecha de modificación como en el resto de páginas.
  const entradas = articulos.map((a) => ({
    url: `${site.url}/blog/${a.slug}`,
    lastModified: a.actualizado ?? a.publicado,
  }));

  return [...paginas, ...entradas];
}
