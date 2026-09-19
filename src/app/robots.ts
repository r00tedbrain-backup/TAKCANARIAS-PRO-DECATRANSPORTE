import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/**
 * El mismo servidor atiende el dominio real y el de pruebas, con el mismo
 * contenido. Si los dos se dejaran indexar, Google vería la web duplicada y
 * repartiría entre ambos la autoridad que debería ir al dominio bueno.
 *
 * Por eso esto se decide leyendo el dominio de cada petición: `www` se indexa
 * y publica su sitemap; `nueva`, y cualquier otro por el que llegue alguien,
 * se bloquea entero.
 *
 * Bloquear aquí no oculta nada: un `Disallow` es una petición que los
 * buscadores respetan, no un control de acceso. Lo que no debe verse no se
 * publica.
 */
export const dynamic = "force-dynamic";

const DOMINIO_PUBLICO = "www.takcanarias.es";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  const esElDominioBueno = host === DOMINIO_PUBLICO || host === "takcanarias.es";

  if (!esElDominioBueno) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El área privada no aporta nada en un buscador y además exige entrar.
      disallow: ["/area-cliente/", "/centro"],
    },
    sitemap: `https://${DOMINIO_PUBLICO}/sitemap.xml`,
  };
}
