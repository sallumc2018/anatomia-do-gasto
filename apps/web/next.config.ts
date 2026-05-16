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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.join(/*turbopackIgnore: true*/ __dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/dados/[...slug]": ["data/public/**/*"],
    "/executivo": ["data/public/**/*"],
    "/receita": ["data/public/**/*"],
    "/transporte": ["data/public/sorocaba/transporte/saida/**/*"],
    "/transporte/comparativo": ["data/public/sorocaba/transporte/saida/**/*"],
    "/transporte/relatorio/[ano]": ["data/public/sorocaba/transporte/saida/**/*"],
    "/saude/relatorio/[ano]": ["data/public/**/*"],
    "/educacao/relatorio/[ano]": ["data/public/**/*"],
    "/seguranca/relatorio/[ano]": ["data/public/**/*"],
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
