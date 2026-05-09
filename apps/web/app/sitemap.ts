import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { getAvailableYears, getAvailableYearsSeguranca, getAvailableYearsTransporte } from "@/lib/data"

const BASE_URL = "https://www.anatomiadogasto.ong.br"
const DATA_ROOT = path.join(process.cwd(), "..", "..", "data", "public", "sorocaba")

function newestMtime(dir: string): Date {
  try {
    const files = fs.readdirSync(dir)
    const mtimes = files.map((f) => fs.statSync(path.join(dir, f)).mtime)
    return mtimes.length > 0 ? new Date(Math.max(...mtimes.map((d) => d.getTime()))) : new Date()
  } catch {
    return new Date()
  }
}

function csvMtime(area: string, filename: string): Date {
  try {
    return fs.statSync(path.join(DATA_ROOT, area, "saida", filename)).mtime
  } catch {
    return newestMtime(path.join(DATA_ROOT, area, "saida"))
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const saudeMtime   = newestMtime(path.join(DATA_ROOT, "saude",    "saida"))
  const educacaoMtime = newestMtime(path.join(DATA_ROOT, "educacao", "saida"))
  const segurancaMtime = newestMtime(path.join(DATA_ROOT, "seguranca", "saida"))
  const transporteMtime = newestMtime(path.join(DATA_ROOT, "transporte", "saida"))
  const datasetsMtime = new Date(Math.max(saudeMtime.getTime(), educacaoMtime.getTime(), segurancaMtime.getTime(), transporteMtime.getTime()))

  const SITE_UPDATED = new Date("2026-05-07")

  const staticRoutes: Array<{ route: string; mtime: Date; freq: "weekly" | "monthly"; priority: number }> = [
    { route: "",                        mtime: datasetsMtime, freq: "weekly",  priority: 1.0 },
    { route: "/saude",                  mtime: saudeMtime,    freq: "monthly", priority: 0.9 },
    { route: "/educacao",               mtime: educacaoMtime, freq: "monthly", priority: 0.9 },
    { route: "/seguranca",              mtime: segurancaMtime,freq: "monthly", priority: 0.9 },
    { route: "/seguranca/comparativo",  mtime: segurancaMtime,freq: "monthly", priority: 0.8 },
    { route: "/transporte",             mtime: transporteMtime,freq: "monthly",priority: 0.9 },
    { route: "/transporte/comparativo", mtime: transporteMtime,freq: "monthly",priority: 0.8 },
    { route: "/dados",                  mtime: datasetsMtime, freq: "monthly", priority: 0.8 },
    { route: "/metodologia",            mtime: SITE_UPDATED,  freq: "monthly", priority: 0.7 },
    { route: "/sobre",                  mtime: SITE_UPDATED,  freq: "monthly", priority: 0.7 },
    { route: "/politica-de-dados",      mtime: SITE_UPDATED,  freq: "monthly", priority: 0.6 },
    { route: "/politica-de-neutralidade",mtime: SITE_UPDATED, freq: "monthly", priority: 0.6 },
    { route: "/termos",                 mtime: SITE_UPDATED,  freq: "monthly", priority: 0.6 },
  ]

  const staticEntries = staticRoutes.map(({ route, mtime, freq, priority }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: mtime,
    changeFrequency: freq,
    priority,
  }))

  const saudeEntries = getAvailableYears("saude").map((year) => ({
    url: `${BASE_URL}/saude/relatorio/${year}`,
    lastModified: csvMtime("saude", `despesas_saude_sorocaba_${year}.csv`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  const educacaoEntries = getAvailableYears("educacao").map((year) => ({
    url: `${BASE_URL}/educacao/relatorio/${year}`,
    lastModified: csvMtime("educacao", `despesas_educacao_sorocaba_${year}.csv`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  const segurancaEntries = getAvailableYearsSeguranca().map((year) => ({
    url: `${BASE_URL}/seguranca/relatorio/${year}`,
    lastModified: csvMtime("seguranca", `despesas_seguranca_sorocaba_${year}.csv`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  const transporteEntries = getAvailableYearsTransporte().map((year) => ({
    url: `${BASE_URL}/transporte/relatorio/${year}`,
    lastModified: csvMtime("transporte", `rreo_transporte_sorocaba_${year}.csv`),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }))

  return [...staticEntries, ...saudeEntries, ...educacaoEntries, ...segurancaEntries, ...transporteEntries]
}
