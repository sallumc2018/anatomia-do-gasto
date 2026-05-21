import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development"

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // React dev mode needs unsafe-eval for call stack reconstruction; never used in production
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  isDev ? "connect-src 'self' ws: http:" : "connect-src 'self' https://vitals.vercel-insights.com",
  !isDev ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

// CORS: Vercel serve Access-Control-Allow-Origin: * por padrão para sites públicos.
// Intencional enquanto não houver autenticação. Antes de implementar login (Câmara 2),
// adicionar um header explícito aqui restringindo ao domínio próprio.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.join(/*turbopackIgnore: true*/ __dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/dados/[...slug]":                          ["data/public/**/*"],
    "/sorocaba/executivo":                           ["data/public/**/*"],
    "/sorocaba/receita":                             ["data/public/**/*"],
    "/sorocaba/transporte":                          ["data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/transporte/comparativo":              ["data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/transporte/relatorio/[ano]":          ["data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/saude/relatorio/[ano]":               ["data/public/**/*"],
    "/sorocaba/educacao/relatorio/[ano]":            ["data/public/**/*"],
    "/sorocaba/seguranca/relatorio/[ano]":           ["data/public/**/*"],
    "/sorocaba/dados":                               ["data/public/**/*"],
  },
  async redirects() {
    const perm = true
    return [
      { source: "/saude",                         destination: "/sorocaba/saude",                         permanent: perm },
      { source: "/saude/comparativo",             destination: "/sorocaba/saude/comparativo",             permanent: perm },
      { source: "/saude/relatorio/:ano",          destination: "/sorocaba/saude/relatorio/:ano",          permanent: perm },
      { source: "/educacao",                      destination: "/sorocaba/educacao",                      permanent: perm },
      { source: "/educacao/comparativo",          destination: "/sorocaba/educacao/comparativo",          permanent: perm },
      { source: "/educacao/relatorio/:ano",       destination: "/sorocaba/educacao/relatorio/:ano",       permanent: perm },
      { source: "/seguranca",                     destination: "/sorocaba/seguranca",                     permanent: perm },
      { source: "/seguranca/comparativo",         destination: "/sorocaba/seguranca/comparativo",         permanent: perm },
      { source: "/seguranca/relatorio/:ano",      destination: "/sorocaba/seguranca/relatorio/:ano",      permanent: perm },
      { source: "/transporte",                    destination: "/sorocaba/transporte",                    permanent: perm },
      { source: "/transporte/comparativo",        destination: "/sorocaba/transporte/comparativo",        permanent: perm },
      { source: "/transporte/relatorio/:ano",     destination: "/sorocaba/transporte/relatorio/:ano",     permanent: perm },
      { source: "/executivo",                     destination: "/sorocaba/executivo",                     permanent: perm },
      { source: "/execucao",                      destination: "/sorocaba/execucao",                      permanent: perm },
      { source: "/receita",                       destination: "/sorocaba/receita",                       permanent: perm },
      { source: "/saude-fiscal",                  destination: "/sorocaba/saude-fiscal",                  permanent: perm },
      { source: "/camara-municipal",              destination: "/sorocaba/camara-municipal",              permanent: perm },
      { source: "/fornecedores",                  destination: "/sorocaba/fornecedores",                  permanent: perm },
      { source: "/pacto-federativo",              destination: "/sorocaba/pacto-federativo",              permanent: perm },
      { source: "/lacunas",                       destination: "/sorocaba/lacunas",                       permanent: perm },
      { source: "/auditoria",                     destination: "/sorocaba/auditoria",                     permanent: perm },
      { source: "/auditoria/ranking",             destination: "/sorocaba/auditoria/ranking",             permanent: perm },
      { source: "/dados",                         destination: "/sorocaba/dados",                         permanent: perm },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          ...(!isDev
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
