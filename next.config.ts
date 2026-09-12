import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  redirects: staticExport ? undefined : async () => [
    { source: "/inicio-2", destination: "/", permanent: true },
    { source: "/inicio-3", destination: "/", permanent: true },
    { source: "/404-2", destination: "/", permanent: true },
    { source: "/descarga-tarjetas", destination: "/descarga-tarjeta", permanent: true },
    { source: "/descarga-tarjetas-2", destination: "/descarga-tarjeta", permanent: true },
    { source: "/favicon.ico", destination: "/brand/favicon.png", permanent: false },
  ],
};

export default nextConfig;
