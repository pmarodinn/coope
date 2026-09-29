/**
 * Build normal: servidor Next com as rotas de API.
 * Build de Pages (PAGES=1): export estático, com a camada de API atendida no
 * navegador por src/lib/api-local.ts. O workflow remove src/app/api antes de
 * compilar, porque o export não aceita rotas dinâmicas.
 */
const paraPages = process.env.PAGES === "1";
const basePath = process.env.BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O selo de desenvolvimento aparecia nas capturas usadas no site.
  devIndicators: false,

  ...(paraPages
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        basePath: basePath || undefined,
        env: {
          NEXT_PUBLIC_ESTATICO: "1",
          NEXT_PUBLIC_BASE_PATH: basePath,
          NEXT_PUBLIC_SITE_URL: process.env.SITE_URL ?? "",
        },
      }
    : {}),
};

export default nextConfig;
