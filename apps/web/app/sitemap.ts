import type { MetadataRoute } from "next"
import { getAvailableYears, getAvailableYearsSeguranca } from "@/lib/data"

const BASE_URL = "https://www.anatomiadogasto.ong.br"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes = [
    "",
    "/saude",
    "/educacao",
    "/seguranca",
    "/seguranca/comparativo",
    "/dados",
    "/metodologia",
    "/sobre",
    "/politica-de-dados",
    "/politica-de-neutralidade",
    "/termos",
    "/auditoria",
    "/auditoria/ranking",
  ]

  const staticEntries = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: (route === "" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: route === "" ? 1 : route === "/saude" || route === "/educacao" ? 0.9 : 0.7,
  }))

  const saudeEntries = getAvailableYears("saude").map((year) => ({
    url: `${BASE_URL}/saude/relatorio/${year}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  const educacaoEntries = getAvailableYears("educacao").map((year) => ({
    url: `${BASE_URL}/educacao/relatorio/${year}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  const segurancaEntries = getAvailableYearsSeguranca().map((year) => ({
    url: `${BASE_URL}/seguranca/relatorio/${year}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...saudeEntries, ...educacaoEntries, ...segurancaEntries]
}
