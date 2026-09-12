import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    { source: "/inicio-2", destination: "/", permanent: true },
    { source: "/inicio-3", destination: "/", permanent: true },
    { source: "/404-2", destination: "/", permanent: true },
    { source: "/descarga-tarjetas", destination: "/descarga-tarjeta", permanent: true },
    { source: "/descarga-tarjetas-2", destination: "/descarga-tarjeta", permanent: true },
    { source: "/favicon.ico", destination: "/brand/favicon.png", permanent: false },
  ],
};

export default nextConfig;
