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
  // outputFileTracingRoot: repo root so that data/public/ paths resolve correctly in Lambdas.
  // IMPORTANT: all process.cwd() calls in server pages MUST have /*turbopackIgnore: true*/
  // to prevent @vercel/nft from auto-tracing data/public/ (248MB) into every Lambda.
  // This only works in Turbopack mode — do NOT use "next build --webpack".
  outputFileTracingRoot: path.join(/*turbopackIgnore: true*/ process.cwd(), "../../"),
  // Belt-and-suspenders: explicitly exclude all of data/public from auto-tracing for
  // the download API. turbopackIgnore in route.ts should already prevent this, but
  // route handlers and server components may be compiled differently by Turbopack.
  // outputFileTracingIncludes (processed after) re-adds the needed ~60MB.
  outputFileTracingExcludes: {
    "*": [
      "../../data/public/sorocaba/despesa/**/*",
      "../../data/public/sorocaba/empenho/**/*",
      "../../data/public/paulinia/despesa/**/*",
    ],
    "**/*": [
      "../../data/public/sorocaba/despesa/**/*",
      "../../data/public/sorocaba/empenho/**/*",
      "../../data/public/paulinia/despesa/**/*",
    ],
    "/api/dados/[...slug]": ["../../data/public/**/*"],
    "/paulinia/executivo": [
      "../../data/public/sorocaba/**/*",
      "../../data/public/paulinia/despesa/**/*",
      "../../data/public/paulinia/orcamento/saida/**/*",
    ],
    "/paulinia/receita": [
      "../../data/public/sorocaba/**/*",
      "../../data/public/paulinia/despesa/**/*",
    ],
    "/sorocaba/executivo": [
      "../../data/public/sorocaba/despesa/**/*",
      "../../data/public/sorocaba/empenho/**/*",
      "../../data/public/paulinia/**/*",
    ],
    "/sorocaba/fornecedores/[codigo]": [
      "../../data/public/sorocaba/despesa/**/*",
      "../../data/public/sorocaba/empenho/**/*",
      "../../data/public/paulinia/**/*",
    ],
    "/sorocaba/receita": [
      "../../data/public/sorocaba/despesa/**/*",
      "../../data/public/sorocaba/empenho/**/*",
      "../../data/public/paulinia/**/*",
    ],
  },
  outputFileTracingIncludes: {
    // Catalog page: reads manifest only — downloads served by route.ts Lambda.
    "/api/dados": ["../../data/manifests/datasets.csv"],
    // API downloads: large Sorocaba dirs (despesa 90MB, autarquias 58MB, empenho 44MB)
    // are redirected to GitHub Raw in route.ts — only small files are bundled here.
    "/api/dados/[...slug]": [
      "../../data/public/paulinia/**/*",
      "../../data/public/sorocaba/camara/**/*",
      "../../data/public/sorocaba/fornecedores/**/*",
      "../../data/public/sorocaba/fiscal/**/*",
      "../../data/public/sorocaba/transferencias/**/*",
      "../../data/public/sorocaba/controle_externo/**/*",
      "../../data/public/sorocaba/contratos/**/*",
      "../../data/public/sorocaba/emendas/**/*",
      "../../data/public/sorocaba/restos/**/*",
      "../../data/public/sorocaba/saude/**/*",
      "../../data/public/sorocaba/transporte/**/*",
      "../../data/public/sorocaba/seguranca/**/*",
      "../../data/public/sorocaba/receita/**/*",
      "../../data/public/sorocaba/executivo/**/*",
      "../../data/public/sorocaba/educacao/**/*",
      "../../data/public/sorocaba/orcamento/**/*",
      "../../data/public/sorocaba/loa/**/*",
      "../../data/public/sao_bernardo/**/*",
      "../../data/public/agentes/**/*",
      "../../data/public/auditoria/**/*",
      "../../data/public/linked/**/*",
    ],
    "/paulinia/saude":                      ["../../data/public/paulinia/saude/saida/**/*", "../../data/public/paulinia/fns/saida/**/*"],
    "/paulinia/educacao":                   ["../../data/public/paulinia/executivo/saida/**/*"],
    "/paulinia/contratos":                  ["../../data/public/paulinia/compras/pncp/saida/**/*"],
    "/paulinia/fornecedores":               ["../../data/public/paulinia/despesa/saida/**/*"],
    "/paulinia/controle-externo":           ["../../data/public/paulinia/controle_externo/tce/saida/**/*"],
    "/paulinia/camara":                     ["../../data/public/paulinia/camara/saida/**/*"],
    "/paulinia/transferencias":             ["../../data/public/paulinia/transferencias_estaduais/saida/**/*", "../../data/public/paulinia/transferencias_federais/saida/**/*"],
    "/sao-paulo/transferencias":            ["../../data/public/sao_paulo/transferencias_estaduais/saida/**/*"],
    "/sao-paulo":                           ["../../data/public/sao_paulo/executivo/saida/**/*"],
    "/sao-paulo/executivo":                 ["../../data/public/sao_paulo/executivo/saida/**/*"],
    "/sao-paulo/receita":                   ["../../data/public/sao_paulo/receita/saida/**/*"],
    "/sao-paulo/seguranca":                 ["../../data/public/sao_paulo/seguranca/saida/**/*"],
    "/sao-paulo/transporte":                ["../../data/public/sao_paulo/transporte/saida/**/*"],
    "/sao-paulo/saude-fiscal":              ["../../data/public/sao_paulo/fiscal/saida/**/*"],
    "/sao-paulo/saude":                     ["../../data/public/sao_paulo/fns/saida/**/*"],
    "/sao-bernardo":                        ["../../data/public/sao_bernardo/receita/saida/**/*"],
    "/sao-bernardo/receita":               ["../../data/public/sao_bernardo/receita/saida/**/*"],
    "/sao-bernardo/saude-fiscal":          ["../../data/public/sao_bernardo/fiscal/saida/**/*"],
    "/sao-bernardo/seguranca":             ["../../data/public/sao_bernardo/seguranca/saida/**/*"],
    "/sao-bernardo/transporte":            ["../../data/public/sao_bernardo/transporte/saida/**/*"],
    "/sorocaba/autarquias": [
      "../../data/public/sorocaba/autarquias/saida/saae_despesas_tce_2020_2026.csv",
      "../../data/public/sorocaba/autarquias/saida/saae_receitas_tce_2020_2026.csv",
      "../../data/public/sorocaba/autarquias/saida/funserv_saude_tce_2020_2026.csv",
      "../../data/public/sorocaba/autarquias/saida/empresas_municipais_tce_2020_2026.csv",
      "../../data/public/sorocaba/autarquias/saida/funserv_rpps_sorocaba.csv",
    ],
    "/sorocaba/camara-municipal":           ["../../data/public/sorocaba/camara/saida/camara_despesas_tce_2020_2026.csv"],
    "/sorocaba/controle-externo":           ["../../data/public/sorocaba/controle_externo/saida/alertas_sdg_2025_sorocaba.csv"],
    "/sorocaba/executivo":                  ["../../data/public/sorocaba/executivo/saida/**/*"],
    "/sorocaba/receita":                    ["../../data/public/sorocaba/receita/saida/**/*"],
    "/sorocaba/transporte":                 ["../../data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/transporte/comparativo":     ["../../data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/transporte/relatorio/[ano]": ["../../data/public/sorocaba/transporte/saida/**/*"],
    "/sorocaba/saude/relatorio/[ano]":      ["../../data/public/sorocaba/saude/saida/**/*"],
    "/sorocaba/educacao/relatorio/[ano]":   ["../../data/public/sorocaba/educacao/saida/**/*"],
    "/sorocaba/seguranca/relatorio/[ano]":  ["../../data/public/sorocaba/seguranca/saida/**/*"],
    "/comparativo": [
      "../../data/public/sao_paulo/executivo/saida/**/*",
      "../../data/public/sorocaba/executivo/saida/**/*",
      "../../data/public/paulinia/executivo/saida/**/*",
    ],
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
      { source: "/emendas",                       destination: "/sorocaba/emendas",                       permanent: perm },
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
