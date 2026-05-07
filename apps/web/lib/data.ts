import fs from "fs"
import path from "path"

/** Todas as áreas do site — usada em componentes de UI. */
export type Area = "saude" | "educacao" | "seguranca"

/**
 * Áreas cujo CSV segue o shape de saúde/educação (HealthRow, parseCSV).
 * Segurança usa estrutura própria (SegurancaRow) e não pertence a este tipo.
 */
export type HealthArea = "saude" | "educacao"

export interface HealthRow {
  funcao: string
  dotacao: number
  empenhada: number
  liquidada: number
  paga: number
  quadrimestre: number
  fonte_pdf: string
}

// Segurança usa SUBFUNCAO_LABELS — estas constantes são exclusivas de saúde/educação
export const FUNCAO_LABELS: Record<HealthArea, Record<string, string>> = {
  saude: {
    "administracao geral":                          "Administração geral",
    "atencao basica":                               "Atenção básica",
    "assistencia hospitalar e ambulatorial":        "Assistência hospitalar e ambulatorial",
    "suporte profilatico e terapeutico":            "Suporte profilático e terapêutico",
    "vigilancia sanitaria":                         "Vigilância sanitária",
    "vigilancia epidemiologica":                    "Vigilância epidemiológica",
    "alimentacao e nutricao":                       "Alimentação e nutrição",
  },
  educacao: {
    "ensino fundamental": "Ensino fundamental",
    "educacao infantil":  "Educação infantil",
  },
}

export const TOTAL_ROW: Record<HealthArea, string> = {
  saude: "DESPESAS LIQUIDAS DA SAUDE",
  educacao: "DESPESAS LIQUIDAS DA EDUCACAO",
}

function parseBrNumber(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0
}

function parseCSV(content: string): HealthRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const fields: string[] = []
    let cur = ""
    let inQ = false
    for (const c of line) {
      if (c === '"') { inQ = !inQ; continue }
      if (c === "," && !inQ) { fields.push(cur); cur = ""; continue }
      cur += c
    }
    fields.push(cur)
    return {
      funcao:       fields[0]?.trim() ?? "",
      dotacao:      parseBrNumber(fields[1] ?? "0"),
      empenhada:    parseBrNumber(fields[2] ?? "0"),
      liquidada:    parseBrNumber(fields[3] ?? "0"),
      paga:         parseBrNumber(fields[4] ?? "0"),
      quadrimestre: parseInt(fields[5] ?? "0"),
      fonte_pdf:    fields[6]?.trim() ?? "",
    }
  }).filter((r) => r.funcao)
}

function findRepoRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    if (fs.existsSync(path.join(dir, "data", "public"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return startDir
    dir = parent
  }
}

function publicDataDir(...parts: string[]): string {
  return path.join(findRepoRoot(process.cwd()), "data", "public", ...parts)
}

function getDataDir(area: HealthArea): string {
  const envKey = area === "saude" ? "DATA_SAIDA_DIR" : `DATA_SAIDA_DIR_${area.toUpperCase()}`
  const envDir = process.env[envKey]
  if (envDir && fs.existsSync(envDir)) return envDir
  return publicDataDir("sorocaba", area, "saida")
}

export function getAvailableYears(area: HealthArea): number[] {
  const dir = getDataDir(area)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^despesas_${area}_sorocaba_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadYearData(year: number, area: HealthArea): HealthRow[] {
  const filePath = path.join(getDataDir(area), `despesas_${area}_sorocaba_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseCSV(fs.readFileSync(filePath, "utf-8"))
}

export interface RevenueRow {
  quadrimestre: number
  proprios_previsao: number
  proprios_arrecadado: number
  transferencias_federais_previsao: number
  transferencias_federais_arrecadado: number
  transferencias_estaduais_previsao: number
  transferencias_estaduais_arrecadado: number
  total_base_previsao: number
  total_base_arrecadado: number
  minimo_saude_previsao: number
  minimo_saude_arrecadado: number
  percentual_aplicado_liquidado: number
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ""
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue }
    if (c === "," && !inQ) { fields.push(cur); cur = ""; continue }
    cur += c
  }
  fields.push(cur)
  return fields
}

function parseRevenueCSV(content: string): RevenueRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []

  // Parse by header name so column order (including optional Fonte_PDF) doesn't matter
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)

  const iQ    = col("quadrimestre")
  const iPP   = col("proprios_previsao")
  const iPA   = col("proprios_arrecadado")
  const iFP   = col("transferencias_federais_previsao")
  const iFA   = col("transferencias_federais_arrecadado")
  const iEP   = col("transferencias_estaduais_previsao")
  const iEA   = col("transferencias_estaduais_arrecadado")
  const iTP   = col("total_base_previsao")
  const iTA   = col("total_base_arrecadado")
  const iMP   = col("minimo_saude_previsao")   >= 0 ? col("minimo_saude_previsao")   : col("minimo_educacao_previsao")
  const iMA   = col("minimo_saude_arrecadado") >= 0 ? col("minimo_saude_arrecadado") : col("minimo_educacao_arrecadado")
  const iPct  = col("percentual_aplicado_liquidado")

  const g = (fields: string[], i: number) => (i >= 0 ? fields[i] ?? "0" : "0")

  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      quadrimestre:                        parseInt(g(f, iQ)),
      proprios_previsao:                   parseBrNumber(g(f, iPP)),
      proprios_arrecadado:                 parseBrNumber(g(f, iPA)),
      transferencias_federais_previsao:    parseBrNumber(g(f, iFP)),
      transferencias_federais_arrecadado:  parseBrNumber(g(f, iFA)),
      transferencias_estaduais_previsao:   parseBrNumber(g(f, iEP)),
      transferencias_estaduais_arrecadado: parseBrNumber(g(f, iEA)),
      total_base_previsao:                 parseBrNumber(g(f, iTP)),
      total_base_arrecadado:               parseBrNumber(g(f, iTA)),
      minimo_saude_previsao:               parseBrNumber(g(f, iMP)),
      minimo_saude_arrecadado:             parseBrNumber(g(f, iMA)),
      percentual_aplicado_liquidado:       parseBrNumber(g(f, iPct)),
    }
  }).filter((r) => r.quadrimestre > 0)
}

export function loadRevenueData(year: number, area: HealthArea): RevenueRow[] {
  const filePath = path.join(getDataDir(area), `receitas_base_${area}_sorocaba_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseRevenueCSV(fs.readFileSync(filePath, "utf-8"))
}

export interface RevenueDetailRow {
  categoria: string
  conta: string
  valor: number
}

function parseRevenueDetailCSV(content: string): RevenueDetailRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const fields: string[] = []
    let cur = ""
    let inQ = false
    for (const c of line) {
      if (c === '"') { inQ = !inQ; continue }
      if (c === "," && !inQ) { fields.push(cur); cur = ""; continue }
      cur += c
    }
    fields.push(cur)
    return {
      categoria: fields[0]?.trim() ?? "",
      conta:     fields[1]?.trim() ?? "",
      valor:     parseFloat(fields[2]?.trim() ?? "0") || 0,
    }
  }).filter((r) => r.categoria && r.conta)
}

export function loadRevenueDetailData(year: number, area: HealthArea): RevenueDetailRow[] {
  const filePath = path.join(getDataDir(area), `receitas_detalhamento_sorocaba_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseRevenueDetailCSV(fs.readFileSync(filePath, "utf-8"))
}

export interface RREODespesasRow {
  funcao: string
  asps_empenhada: number
  asps_liquidada: number
  asps_paga: number
  sus_empenhada: number
  sus_liquidada: number
  sus_paga: number
  total_empenhada: number
  total_liquidada: number
  total_paga: number
  quadrimestre: number
}

function parseRREODespesasCSV(content: string): RREODespesasRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const cols: string[] = []
    let cur = ""
    let inQ = false
    for (const c of line) {
      if (c === '"') { inQ = !inQ; continue }
      if (c === "," && !inQ) { cols.push(cur); cur = ""; continue }
      cur += c
    }
    cols.push(cur)
    return {
      funcao:          cols[0]?.trim() ?? "",
      asps_empenhada:  parseBrNumber(cols[1]  ?? "0"),
      asps_liquidada:  parseBrNumber(cols[2]  ?? "0"),
      asps_paga:       parseBrNumber(cols[3]  ?? "0"),
      sus_empenhada:   parseBrNumber(cols[4]  ?? "0"),
      sus_liquidada:   parseBrNumber(cols[5]  ?? "0"),
      sus_paga:        parseBrNumber(cols[6]  ?? "0"),
      total_empenhada: parseBrNumber(cols[7]  ?? "0"),
      total_liquidada: parseBrNumber(cols[8]  ?? "0"),
      total_paga:      parseBrNumber(cols[9]  ?? "0"),
      quadrimestre:    parseInt(cols[10] ?? "0"),
    }
  }).filter((r) => r.funcao)
}

export function loadRREODespesas(year: number): RREODespesasRow[] {
  const filePath = path.join(
    process.env.DATA_SAIDA_DIR ?? publicDataDir("sorocaba", "saude", "saida"),
    `rreo_despesas_saude_sorocaba_${year}.csv`
  )
  if (!fs.existsSync(filePath)) return []
  return parseRREODespesasCSV(fs.readFileSync(filePath, "utf-8"))
}

export interface RREOReceitasRow {
  quadrimestre: number
  sus_total_previsao: number
  sus_total_arrecadado: number
  sus_uniao_previsao: number
  sus_uniao_arrecadado: number
  sus_estados_previsao: number
  sus_estados_arrecadado: number
  percentual_asps: number
}

function parseRREOReceitasCSV(content: string): RREOReceitasRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const cols: string[] = []
    let cur = ""
    let inQ = false
    for (const c of line) {
      if (c === '"') { inQ = !inQ; continue }
      if (c === "," && !inQ) { cols.push(cur); cur = ""; continue }
      cur += c
    }
    cols.push(cur)
    return {
      quadrimestre:           parseInt(cols[0]  ?? "0"),
      sus_total_previsao:     parseBrNumber(cols[1]  ?? "0"),
      sus_total_arrecadado:   parseBrNumber(cols[2]  ?? "0"),
      sus_uniao_previsao:     parseBrNumber(cols[3]  ?? "0"),
      sus_uniao_arrecadado:   parseBrNumber(cols[4]  ?? "0"),
      sus_estados_previsao:   parseBrNumber(cols[5]  ?? "0"),
      sus_estados_arrecadado: parseBrNumber(cols[6]  ?? "0"),
      percentual_asps:        parseBrNumber(cols[7]  ?? "0"),
    }
  }).filter((r) => r.quadrimestre > 0)
}

export function loadRREOReceitas(year: number): RREOReceitasRow[] {
  const filePath = path.join(
    process.env.DATA_SAIDA_DIR ?? publicDataDir("sorocaba", "saude", "saida"),
    `rreo_receitas_sus_sorocaba_${year}.csv`
  )
  if (!fs.existsSync(filePath)) return []
  return parseRREOReceitasCSV(fs.readFileSync(filePath, "utf-8"))
}

export interface SegurancaRow {
  subfuncao: string
  empenhada: number
  liquidada: number
  paga: number
  restos_nao_processados: number
  restos_processados: number
  fonte_url: string
}

function parseSegurancaCSV(content: string): SegurancaRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const iSF  = col("subfuncao")
  const iEmp = col("empenhada")
  const iLiq = col("liquidada")
  const iPag = col("paga")
  const iRNP = col("restos_nao_processados")
  const iRP  = col("restos_processados")
  const iURL = col("fonte_url")
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      subfuncao:              g(f, iSF).trim(),
      empenhada:              parseBrNumber(g(f, iEmp)),
      liquidada:              parseBrNumber(g(f, iLiq)),
      paga:                   parseBrNumber(g(f, iPag)),
      restos_nao_processados: parseBrNumber(g(f, iRNP)),
      restos_processados:     parseBrNumber(g(f, iRP)),
      fonte_url:              g(f, iURL).trim(),
    }
  }).filter((r) => r.subfuncao)
}

function getSegurancaDir(): string {
  const envDir = process.env.DATA_SAIDA_DIR_SEGURANCA
  if (envDir && fs.existsSync(envDir)) return envDir
  return publicDataDir("sorocaba", "seguranca", "saida")
}

export function getAvailableYearsSeguranca(): number[] {
  const dir = getSegurancaDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(/^despesas_seguranca_sorocaba_(\d{4})\.csv$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadSegurancaData(year: number): SegurancaRow[] {
  const filePath = path.join(getSegurancaDir(), `despesas_seguranca_sorocaba_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseSegurancaCSV(fs.readFileSync(filePath, "utf-8"))
}

export const SUBFUNCAO_LABELS: Record<string, string> = {
  "06 - Segurança Pública":        "Total — Segurança Pública",
  "06.122 - Administração Geral":  "Guarda Municipal (Admin Geral)",
  "06.181 - Policiamento":         "Policiamento",
  "06.182 - Defesa Civil":         "Defesa Civil",
  "06.183 - Informação e Inteligência": "Informação e Inteligência",
}

export function formatMillions(value: number): string {
  const m = value / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} milhões`
}

export function formatPrecise(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
