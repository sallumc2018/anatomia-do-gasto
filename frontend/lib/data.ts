import fs from "fs"
import path from "path"

export type Area = "saude" | "educacao"

export interface HealthRow {
  funcao: string
  dotacao: number
  empenhada: number
  liquidada: number
  paga: number
  quadrimestre: number
}

// Labels por área
export const FUNCAO_LABELS: Record<Area, Record<string, string>> = {
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

export const TOTAL_ROW: Record<Area, string> = {
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
    }
  }).filter((r) => r.funcao)
}

function getDataDir(area: Area): string {
  const envKey = area === "saude" ? "DATA_SAIDA_DIR" : `DATA_SAIDA_DIR_${area.toUpperCase()}`
  return process.env[envKey] ?? path.join(process.cwd(), "..", "sorocaba", area, "saida")
}

export function getAvailableYears(area: Area): number[] {
  const dir = getDataDir(area)
  if (!fs.existsSync(dir)) return []
  const prefix = `despesas_${area}_sorocaba_`
  const suffix = ".csv"
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^despesas_${area}_sorocaba_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadYearData(year: number, area: Area): HealthRow[] {
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

function parseRevenueCSV(content: string): RevenueRow[] {
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
      quadrimestre:                        parseInt(fields[0]  ?? "0"),
      proprios_previsao:                   parseBrNumber(fields[1]  ?? "0"),
      proprios_arrecadado:                 parseBrNumber(fields[2]  ?? "0"),
      transferencias_federais_previsao:    parseBrNumber(fields[3]  ?? "0"),
      transferencias_federais_arrecadado:  parseBrNumber(fields[4]  ?? "0"),
      transferencias_estaduais_previsao:   parseBrNumber(fields[5]  ?? "0"),
      transferencias_estaduais_arrecadado: parseBrNumber(fields[6]  ?? "0"),
      total_base_previsao:                 parseBrNumber(fields[7]  ?? "0"),
      total_base_arrecadado:               parseBrNumber(fields[8]  ?? "0"),
      minimo_saude_previsao:               parseBrNumber(fields[9]  ?? "0"),
      minimo_saude_arrecadado:             parseBrNumber(fields[10] ?? "0"),
      percentual_aplicado_liquidado:       parseBrNumber(fields[11] ?? "0"),
    }
  }).filter((r) => r.quadrimestre > 0)
}

export function loadRevenueData(year: number, area: Area): RevenueRow[] {
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

export function loadRevenueDetailData(year: number, area: Area): RevenueDetailRow[] {
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
    process.env.DATA_SAIDA_DIR ?? path.join(process.cwd(), "..", "sorocaba", "saude", "saida"),
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
    process.env.DATA_SAIDA_DIR ?? path.join(process.cwd(), "..", "sorocaba", "saude", "saida"),
    `rreo_receitas_sus_sorocaba_${year}.csv`
  )
  if (!fs.existsSync(filePath)) return []
  return parseRREOReceitasCSV(fs.readFileSync(filePath, "utf-8"))
}

export function formatMillions(value: number): string {
  const m = value / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} milhões`
}

export function formatPrecise(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
