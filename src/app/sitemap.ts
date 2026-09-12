import type { MetadataRoute } from "next";
import { services, site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Prepared for launch; no fabricated modification dates or private routes.
  return ["", ...services.map(({ slug }) => slug), "contacto", "descarga-tarjeta", "plataforma-gps"].map((slug) => ({ url: `${site.url}/${slug}` }));
}
