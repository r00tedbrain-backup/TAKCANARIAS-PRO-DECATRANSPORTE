import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` empaqueta solo lo necesario para ejecutar: la imagen final
  // no lleva el código fuente ni las dependencias de desarrollo.
  output: "standalone",

  redirects: async () => [
    { source: "/inicio-2", destination: "/", permanent: true },
    { source: "/inicio-3", destination: "/", permanent: true },
    { source: "/404-2", destination: "/", permanent: true },
    { source: "/descarga-tarjetas", destination: "/descarga-tarjeta", permanent: true },
    { source: "/descarga-tarjetas-2", destination: "/descarga-tarjeta", permanent: true },
    { source: "/favicon.ico", destination: "/brand/favicon.png", permanent: false },
  ],

  // Detrás del proxy de Caddy: sin esto, las cabeceras de origen real no
  // llegan y el control de intentos contaría todo como una sola IP.
  poweredByHeader: false,
};

export default nextConfig;
