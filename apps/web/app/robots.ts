import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.anatomiadogasto.ong.br/sitemap.xml",
    host: "https://www.anatomiadogasto.ong.br",
  }
}
