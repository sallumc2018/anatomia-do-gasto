import fs from "fs"
import path from "path"

/** Todas as áreas do site — usada em componentes de UI. */
export type Area = "saude" | "educacao" | "seguranca" | "transporte"

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

const DATA_PUBLIC_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")

function getDataDirs(municipio: string) {
  return {
    saude:      path.join(DATA_PUBLIC_ROOT, municipio, "saude",      "saida"),
    educacao:   path.join(DATA_PUBLIC_ROOT, municipio, "educacao",   "saida"),
    seguranca:  path.join(DATA_PUBLIC_ROOT, municipio, "seguranca",  "saida"),
    transporte: path.join(DATA_PUBLIC_ROOT, municipio, "transporte", "saida"),
    executivo:  path.join(DATA_PUBLIC_ROOT, municipio, "executivo",  "saida"),
    receita:    path.join(DATA_PUBLIC_ROOT, municipio, "receita",    "saida"),
  }
}

function maybeDevDataDir(envKey: string): string | null {
  if (process.env.NODE_ENV === "production") return null
  const envDir = process.env[envKey]
  return envDir && fs.existsSync(envDir) ? envDir : null
}

function getDataDir(area: HealthArea, municipio = "sorocaba"): string {
  const envKey = area === "saude" ? "DATA_SAIDA_DIR" : `DATA_SAIDA_DIR_${area.toUpperCase()}`
  return maybeDevDataDir(envKey) ?? getDataDirs(municipio)[area]
}

export function getAvailableYears(area: HealthArea, municipio = "sorocaba"): number[] {
  const dir = getDataDir(area, municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^despesas_${area}_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadYearData(year: number, area: HealthArea, municipio = "sorocaba"): HealthRow[] {
  const filePath = path.join(getDataDir(area, municipio), `despesas_${area}_${municipio}_${year}.csv`)
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

export function loadRevenueData(year: number, area: HealthArea, municipio = "sorocaba"): RevenueRow[] {
  const filePath = path.join(getDataDir(area, municipio), `receitas_base_${area}_${municipio}_${year}.csv`)
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

export function loadRevenueDetailData(year: number, area: HealthArea, municipio = "sorocaba"): RevenueDetailRow[] {
  const filePath = path.join(getDataDir(area, municipio), `receitas_detalhamento_${municipio}_${year}.csv`)
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

export function loadRREODespesas(year: number, municipio = "sorocaba"): RREODespesasRow[] {
  const filePath = path.join(
    maybeDevDataDir("DATA_SAIDA_DIR") ?? getDataDirs(municipio).saude,
    `rreo_despesas_saude_${municipio}_${year}.csv`
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

export function loadRREOReceitas(year: number, municipio = "sorocaba"): RREOReceitasRow[] {
  const filePath = path.join(
    maybeDevDataDir("DATA_SAIDA_DIR") ?? getDataDirs(municipio).saude,
    `rreo_receitas_sus_${municipio}_${year}.csv`
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

function getSegurancaDir(municipio = "sorocaba"): string {
  return maybeDevDataDir("DATA_SAIDA_DIR_SEGURANCA") ?? getDataDirs(municipio).seguranca
}

export function getAvailableYearsSeguranca(municipio = "sorocaba"): number[] {
  const dir = getSegurancaDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^despesas_seguranca_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadSegurancaData(year: number, municipio = "sorocaba"): SegurancaRow[] {
  const filePath = path.join(getSegurancaDir(municipio), `despesas_seguranca_${municipio}_${year}.csv`)
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

export interface SegurancaOrcamentoRow {
  ano: number
  dotacao_inicial: number
  dotacao_atualizada: number
  /** EXCETO INTRA-ORÇAMENTÁRIAS. Em 2020 e 2022-2025 coincide com DCA Empenhada. */
  empenhado: number
  /** Componente INTRA-ORÇAMENTÁRIO — dado de auditoria.
   *  Em 2021 o DCA consolidou EXCETO+INTRA; nos demais anos DCA=EXCETO apenas. */
  intra_empenhado: number
  liquidado: number
  intra_liquidado: number
  pct_orcamento: number
  total_municipal_empenhado: number
  fonte_url: string
}

function parseSegurancaOrcamentoCSV(content: string): SegurancaOrcamentoRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const iAno   = col("ano")
  const iDI    = col("dotacao_inicial")
  const iDA    = col("dotacao_atualizada")
  const iEmp   = col("empenhado")
  const iIEmp  = col("intra_empenhado")
  const iLiq   = col("liquidado")
  const iILiq  = col("intra_liquidado")
  const iPct   = col("pct_orcamento")
  const iTotal = col("total_municipal_empenhado")
  const iURL   = col("fonte_url")
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                       parseInt(g(f, iAno)),
    dotacao_inicial:           parseBrNumber(g(f, iDI)),
    dotacao_atualizada:        parseBrNumber(g(f, iDA)),
    empenhado:                 parseBrNumber(g(f, iEmp)),
    intra_empenhado:           parseBrNumber(g(f, iIEmp)),
    liquidado:                 parseBrNumber(g(f, iLiq)),
    intra_liquidado:           parseBrNumber(g(f, iILiq)),
    pct_orcamento:             parseBrNumber(g(f, iPct)),
    total_municipal_empenhado: parseBrNumber(g(f, iTotal)),
    fonte_url:                 g(f, iURL).trim(),
  }
}

export function loadSegurancaOrcamento(year: number, municipio = "sorocaba"): SegurancaOrcamentoRow | null {
  const filePath = path.join(getSegurancaDir(municipio), `rreo_seguranca_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseSegurancaOrcamentoCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Transporte ──────────────────────────────────────────────────────────────

function getTransporteDir(municipio = "sorocaba"): string {
  return maybeDevDataDir("DATA_SAIDA_DIR_TRANSPORTE") ?? getDataDirs(municipio).transporte
}

export function getAvailableYearsTransporte(municipio = "sorocaba"): number[] {
  const dir = getTransporteDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^rreo_transporte_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export interface TransporteOrcamentoRow {
  ano: number
  dotacao_inicial: number
  dotacao_atualizada: number
  /** EXCETO INTRA-ORÇAMENTÁRIAS. DCA Empenhado = RREO EXCETO em todos os anos verificados. */
  empenhado: number
  /** INTRA-ORÇAMENTÁRIO — componente minoritário, dado de auditoria. */
  intra_empenhado: number
  liquidado: number
  intra_liquidado: number
  pct_orcamento: number
  total_municipal_empenhado: number
  fonte_url: string
}

export interface TransporteDcaRow {
  ano: number
  empenhado: number
  liquidado: number
  pago: number
  rp_nao_processado: number
  rp_processado: number
  fonte_url: string
}

function parseTransporteOrcamentoCSV(content: string): TransporteOrcamentoRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                       parseInt(g(f, col("ano"))),
    dotacao_inicial:           parseBrNumber(g(f, col("dotacao_inicial"))),
    dotacao_atualizada:        parseBrNumber(g(f, col("dotacao_atualizada"))),
    empenhado:                 parseBrNumber(g(f, col("empenhado"))),
    intra_empenhado:           parseBrNumber(g(f, col("intra_empenhado"))),
    liquidado:                 parseBrNumber(g(f, col("liquidado"))),
    intra_liquidado:           parseBrNumber(g(f, col("intra_liquidado"))),
    pct_orcamento:             parseBrNumber(g(f, col("pct_orcamento"))),
    total_municipal_empenhado: parseBrNumber(g(f, col("total_municipal_empenhado"))),
    fonte_url:                 g(f, col("fonte_url")).trim(),
  }
}

function parseTransporteDcaCSV(content: string): TransporteDcaRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:               parseInt(g(f, col("ano"))),
    empenhado:         parseBrNumber(g(f, col("empenhado"))),
    liquidado:         parseBrNumber(g(f, col("liquidado"))),
    pago:              parseBrNumber(g(f, col("pago"))),
    rp_nao_processado: parseBrNumber(g(f, col("rp_nao_processado"))),
    rp_processado:     parseBrNumber(g(f, col("rp_processado"))),
    fonte_url:         g(f, col("fonte_url")).trim(),
  }
}

export function loadTransporteOrcamento(year: number, municipio = "sorocaba"): TransporteOrcamentoRow | null {
  const filePath = path.join(getTransporteDir(municipio), `rreo_transporte_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseTransporteOrcamentoCSV(fs.readFileSync(filePath, "utf-8"))
}

export function loadTransporteDca(year: number, municipio = "sorocaba"): TransporteDcaRow | null {
  const filePath = path.join(getTransporteDir(municipio), `dca_transporte_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseTransporteDcaCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Executivo (orçamento municipal total por função) ─────────────────────────

export interface ExecutivoRow {
  funcao: string
  dotacao_inicial: number
  dotacao_atualizada: number
  empenhado: number
  liquidado: number
  exceto_intra_liquidado: number
  intra_liquidado: number
  fonte_url: string
}

function getExecutivoDir(municipio = "sorocaba"): string {
  return maybeDevDataDir("DATA_SAIDA_DIR_EXECUTIVO") ?? getDataDirs(municipio).executivo
}

function parseExecutivoCSV(content: string): ExecutivoRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      funcao:                 g(f, col("funcao")).trim(),
      dotacao_inicial:        parseFloat(g(f, col("dotacao_inicial")))  || 0,
      dotacao_atualizada:     parseFloat(g(f, col("dotacao_atualizada"))) || 0,
      empenhado:              parseFloat(g(f, col("empenhado")))        || 0,
      liquidado:              parseFloat(g(f, col("liquidado")))        || 0,
      exceto_intra_liquidado: parseFloat(g(f, col("exceto_intra_liquidado"))) || 0,
      intra_liquidado:        parseFloat(g(f, col("intra_liquidado")))  || 0,
      fonte_url:              g(f, col("fonte_url")).trim(),
    }
  }).filter((r) => r.funcao)
}

export function getAvailableYearsExecutivo(municipio = "sorocaba"): number[] {
  const dir = getExecutivoDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^despesas_executivo_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadExecutivoData(year: number, municipio = "sorocaba"): ExecutivoRow[] {
  const filePath = path.join(getExecutivoDir(municipio), `despesas_executivo_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseExecutivoCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Receita Municipal (RREO Anexo 01) ───────────────────────────────────────

export interface ReceitaMunicipalRow {
  categoria: string
  cod_conta: string
  previsto_inicial: number
  previsto_atualizado: number
  arrecadado_bimestre: number
  arrecadado_acumulado: number
  fonte_url: string
}

function getReceitaDir(municipio = "sorocaba"): string {
  return maybeDevDataDir("DATA_SAIDA_DIR_RECEITA") ?? getDataDirs(municipio).receita
}

function parseReceitaMunicipalCSV(content: string): ReceitaMunicipalRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      categoria:            g(f, col("categoria")).trim(),
      cod_conta:            g(f, col("cod_conta")).trim(),
      previsto_inicial:     parseFloat(g(f, col("previsto_inicial"))) || 0,
      previsto_atualizado:  parseFloat(g(f, col("previsto_atualizado"))) || 0,
      arrecadado_bimestre:  parseFloat(g(f, col("arrecadado_bimestre"))) || 0,
      arrecadado_acumulado: parseFloat(g(f, col("arrecadado_acumulado"))) || 0,
      fonte_url:            g(f, col("fonte_url")).trim(),
    }
  }).filter((r) => r.categoria)
}

export function getAvailableYearsReceita(municipio = "sorocaba"): number[] {
  const dir = getReceitaDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^receitas_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadReceitaMunicipal(year: number, municipio = "sorocaba"): ReceitaMunicipalRow[] {
  const filePath = path.join(getReceitaDir(municipio), `receitas_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseReceitaMunicipalCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Saúde Fiscal (RGF Anexo 01 + 02 + RREO Anexo 03) ───────────────────────

function getFiscalDir(municipio = "sorocaba"): string {
  return maybeDevDataDir("DATA_SAIDA_DIR_FISCAL") ?? path.join(DATA_PUBLIC_ROOT, municipio, "fiscal", "saida")
}

export interface PessoalRow {
  ano: number
  rcl: number
  rcl_ajustada: number
  pessoal_bruto: number
  pessoal_ativo: number
  pessoal_inativo: number
  pessoal_liquido: number
  dtp: number
  dtp_pct_rcl: number
  limite_maximo_pct: number
  limite_prudencial_pct: number
  limite_alerta_pct: number
  fonte_url: string
}

export interface DividaRow {
  ano: number
  dc_bruta: number
  dc_contratual: number
  emprestimos: number
  financiamentos: number
  precatorios: number
  deducoes: number
  dcl: number
  rcl: number
  dc_pct_rcl: number
  dcl_pct_rcl: number
  limite_valor: number
  limite_pct_rcl: number
  passivo_atuarial: number
  fonte_url: string
}

export interface RclDetalhadaRow {
  ano: number
  receitas_correntes: number
  iptu: number
  iss: number
  itbi: number
  irrf: number
  outras_tributarias: number
  transferencias_total: number
  fpm: number
  icms: number
  ipva: number
  fundeb: number
  outras_transferencias: number
  receita_servicos: number
  receita_patrimonial: number
  receita_contribuicoes: number
  outras_correntes: number
  outros: number
  fonte_url: string
}

function parsePessoalCSV(content: string): PessoalRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                   parseInt(g(f, col("ano"))),
    rcl:                   parseFloat(g(f, col("rcl"))) || 0,
    rcl_ajustada:          parseFloat(g(f, col("rcl_ajustada"))) || 0,
    pessoal_bruto:         parseFloat(g(f, col("pessoal_bruto"))) || 0,
    pessoal_ativo:         parseFloat(g(f, col("pessoal_ativo"))) || 0,
    pessoal_inativo:       parseFloat(g(f, col("pessoal_inativo"))) || 0,
    pessoal_liquido:       parseFloat(g(f, col("pessoal_liquido"))) || 0,
    dtp:                   parseFloat(g(f, col("dtp"))) || 0,
    dtp_pct_rcl:           parseFloat(g(f, col("dtp_pct_rcl"))) || 0,
    limite_maximo_pct:     parseFloat(g(f, col("limite_maximo_pct"))) || 54,
    limite_prudencial_pct: parseFloat(g(f, col("limite_prudencial_pct"))) || 51.3,
    limite_alerta_pct:     parseFloat(g(f, col("limite_alerta_pct"))) || 48.6,
    fonte_url:             g(f, col("fonte_url")).trim(),
  }
}

function parseDividaCSV(content: string): DividaRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:           parseInt(g(f, col("ano"))),
    dc_bruta:      parseFloat(g(f, col("dc_bruta"))) || 0,
    dc_contratual: parseFloat(g(f, col("dc_contratual"))) || 0,
    emprestimos:   parseFloat(g(f, col("emprestimos"))) || 0,
    financiamentos:parseFloat(g(f, col("financiamentos"))) || 0,
    precatorios:   parseFloat(g(f, col("precatorios"))) || 0,
    deducoes:      parseFloat(g(f, col("deducoes"))) || 0,
    dcl:           parseFloat(g(f, col("dcl"))) || 0,
    rcl:           parseFloat(g(f, col("rcl"))) || 0,
    dc_pct_rcl:    parseFloat(g(f, col("dc_pct_rcl"))) || 0,
    dcl_pct_rcl:   parseFloat(g(f, col("dcl_pct_rcl"))) || 0,
    limite_valor:  parseFloat(g(f, col("limite_valor"))) || 0,
    limite_pct_rcl:parseFloat(g(f, col("limite_pct_rcl"))) || 120,
    passivo_atuarial: parseFloat(g(f, col("passivo_atuarial"))) || 0,
    fonte_url:     g(f, col("fonte_url")).trim(),
  }
}

function parseRclDetalhadaCSV(content: string): RclDetalhadaRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                   parseInt(g(f, col("ano"))),
    receitas_correntes:    parseFloat(g(f, col("receitas_correntes"))) || 0,
    iptu:                  parseFloat(g(f, col("iptu"))) || 0,
    iss:                   parseFloat(g(f, col("iss"))) || 0,
    itbi:                  parseFloat(g(f, col("itbi"))) || 0,
    irrf:                  parseFloat(g(f, col("irrf"))) || 0,
    outras_tributarias:    parseFloat(g(f, col("outras_tributarias"))) || 0,
    transferencias_total:  parseFloat(g(f, col("transferencias_total"))) || 0,
    fpm:                   parseFloat(g(f, col("fpm"))) || 0,
    icms:                  parseFloat(g(f, col("icms"))) || 0,
    ipva:                  parseFloat(g(f, col("ipva"))) || 0,
    fundeb:                parseFloat(g(f, col("fundeb"))) || 0,
    outras_transferencias: parseFloat(g(f, col("outras_transferencias"))) || 0,
    receita_servicos:      parseFloat(g(f, col("receita_servicos"))) || 0,
    receita_patrimonial:   parseFloat(g(f, col("receita_patrimonial"))) || 0,
    receita_contribuicoes: parseFloat(g(f, col("receita_contribuicoes"))) || 0,
    outras_correntes:      parseFloat(g(f, col("outras_correntes"))) || 0,
    outros:                parseFloat(g(f, col("outros"))) || 0,
    fonte_url:             g(f, col("fonte_url")).trim(),
  }
}

export function getAvailableYearsFiscal(municipio = "sorocaba"): number[] {
  const dir = getFiscalDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^pessoal_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadPessoal(year: number, municipio = "sorocaba"): PessoalRow | null {
  const filePath = path.join(getFiscalDir(municipio), `pessoal_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parsePessoalCSV(fs.readFileSync(filePath, "utf-8"))
}

export function loadDivida(year: number, municipio = "sorocaba"): DividaRow | null {
  const filePath = path.join(getFiscalDir(municipio), `divida_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseDividaCSV(fs.readFileSync(filePath, "utf-8"))
}

export function loadRclDetalhada(year: number, municipio = "sorocaba"): RclDetalhadaRow | null {
  const filePath = path.join(getFiscalDir(municipio), `rcl_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseRclDetalhadaCSV(fs.readFileSync(filePath, "utf-8"))
}

export function formatMillions(value: number): string {
  if (value < 1_000_000) {
    const k = value / 1_000
    return `R$ ${k.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`
  }
  const m = value / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} milhões`
}

export function formatPrecise(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── RPPS (RREO Anexo 04) ─────────────────────────────────────────────────────

export interface RppsRow {
  ano: number
  contribuicoes_segurados: number
  contribuicoes_patronal: number
  total_receitas_rpps: number
  aposentadorias: number
  total_despesas_rpps: number
  resultado_rpps: number
  fonte_url: string
}

function parseRppsCSV(content: string): RppsRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                     parseInt(g(f, col("ano"))),
    contribuicoes_segurados: parseFloat(g(f, col("contribuicoes_segurados"))) || 0,
    contribuicoes_patronal:  parseFloat(g(f, col("contribuicoes_patronal")))  || 0,
    total_receitas_rpps:     parseFloat(g(f, col("total_receitas_rpps")))     || 0,
    aposentadorias:          parseFloat(g(f, col("aposentadorias")))          || 0,
    total_despesas_rpps:     parseFloat(g(f, col("total_despesas_rpps")))     || 0,
    resultado_rpps:          parseFloat(g(f, col("resultado_rpps")))          || 0,
    fonte_url:               g(f, col("fonte_url")).trim(),
  }
}

export function loadRpps(year: number, municipio = "sorocaba"): RppsRow | null {
  const filePath = path.join(getFiscalDir(municipio), `rpps_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseRppsCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Receitas de Capital (RREO Anexo 01) ─────────────────────────────────────

export interface RclCapitalRow {
  ano: number
  op_credito_internas: number
  op_credito_externas: number
  op_credito_total: number
  alienacao_bens: number
  alienacao_bens_imoveis: number
  alienacao_bens_moveis: number
  outras_capital: number
  total_capital: number
  fonte_url: string
}

function parseRclCapitalCSV(content: string): RclCapitalRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                    parseInt(g(f, col("ano"))),
    op_credito_internas:    parseFloat(g(f, col("operacoes_credito_internas"))) || 0,
    op_credito_externas:    parseFloat(g(f, col("operacoes_credito_externas"))) || 0,
    op_credito_total:       parseFloat(g(f, col("operacoes_credito_total")))    || 0,
    alienacao_bens:         parseFloat(g(f, col("alienacao_bens")))             || 0,
    alienacao_bens_imoveis: parseFloat(g(f, col("alienacao_bens_imoveis")))     || 0,
    alienacao_bens_moveis:  parseFloat(g(f, col("alienacao_bens_moveis")))      || 0,
    outras_capital:         parseFloat(g(f, col("outras_capital")))             || 0,
    total_capital:          parseFloat(g(f, col("total_capital")))              || 0,
    fonte_url:              g(f, col("fonte_url")).trim(),
  }
}

export function loadRclCapital(year: number, municipio = "sorocaba"): RclCapitalRow | null {
  const filePath = path.join(getFiscalDir(municipio), `rcl_capital_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseRclCapitalCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Natureza da Despesa (RREO Anexo 01) ─────────────────────────────────────

export interface NaturezaDespesaRow {
  ano: number
  pessoal: number
  juros_encargos: number
  outras_correntes: number
  despesas_correntes: number
  investimentos: number
  despesas_capital: number
  total_despesas: number
  fonte_url: string
}

function parseNaturezaDespesaCSV(content: string): NaturezaDespesaRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                parseInt(g(f, col("ano"))),
    pessoal:            parseFloat(g(f, col("pessoal")))             || 0,
    juros_encargos:     parseFloat(g(f, col("juros_encargos")))      || 0,
    outras_correntes:   parseFloat(g(f, col("outras_correntes")))    || 0,
    despesas_correntes: parseFloat(g(f, col("despesas_correntes")))  || 0,
    investimentos:      parseFloat(g(f, col("investimentos")))       || 0,
    despesas_capital:   parseFloat(g(f, col("despesas_capital")))    || 0,
    total_despesas:     parseFloat(g(f, col("total_despesas")))      || 0,
    fonte_url:          g(f, col("fonte_url")).trim(),
  }
}

export function loadNaturezaDespesa(year: number, municipio = "sorocaba"): NaturezaDespesaRow | null {
  const filePath = path.join(getFiscalDir(municipio), `natureza_despesa_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseNaturezaDespesaCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Dívida Detalhada (RGF Anexo 02 — com split interno/externo) ──────────────

export interface DividaDetalhadaRow extends DividaRow {
  emp_internos: number
  emp_externos: number
  fin_internos: number
  precatorios_total: number
  outras_dividas: number
  disponibilidade_caixa_bruta: number
  rp_processados: number
}

function parseDividaDetalhadaCSV(content: string): DividaDetalhadaRow | null {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "0" : "0")
  const f = splitCsvLine(lines[1])
  return {
    ano:                       parseInt(g(f, col("ano"))),
    dc_bruta:                  parseFloat(g(f, col("dc_bruta")))                  || 0,
    dc_contratual:             parseFloat(g(f, col("dc_contratual")))             || 0,
    emprestimos:               parseFloat(g(f, col("emprestimos")))               || 0,
    financiamentos:            parseFloat(g(f, col("financiamentos")))            || 0,
    precatorios:               parseFloat(g(f, col("precatorios_vencidos")))      || 0,
    deducoes:                  parseFloat(g(f, col("deducoes")))                  || 0,
    dcl:                       parseFloat(g(f, col("dcl")))                       || 0,
    rcl:                       parseFloat(g(f, col("rcl")))                       || 0,
    dc_pct_rcl:                parseFloat(g(f, col("dc_pct_rcl")))                || 0,
    dcl_pct_rcl:               parseFloat(g(f, col("dcl_pct_rcl")))              || 0,
    limite_valor:              parseFloat(g(f, col("limite_valor")))              || 0,
    limite_pct_rcl:            parseFloat(g(f, col("limite_pct_rcl")))            || 120,
    passivo_atuarial:          parseFloat(g(f, col("passivo_atuarial")))          || 0,
    fonte_url:                 g(f, col("fonte_url")).trim(),
    emp_internos:              parseFloat(g(f, col("emp_internos")))              || 0,
    emp_externos:              parseFloat(g(f, col("emp_externos")))              || 0,
    fin_internos:              parseFloat(g(f, col("fin_internos")))              || 0,
    precatorios_total:         parseFloat(g(f, col("precatorios_total")))         || 0,
    outras_dividas:            parseFloat(g(f, col("outras_dividas")))            || 0,
    disponibilidade_caixa_bruta: parseFloat(g(f, col("disponibilidade_caixa_bruta"))) || 0,
    rp_processados:            parseFloat(g(f, col("rp_processados")))            || 0,
  }
}

export function loadDividaDetalhada(year: number, municipio = "sorocaba"): DividaDetalhadaRow | null {
  const filePath = path.join(getFiscalDir(municipio), `divida_detalhada_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return null
  return parseDividaDetalhadaCSV(fs.readFileSync(filePath, "utf-8"))
}

// ─── Fornecedores (conta-corrente agregada por destinatário) ──────────────────

export interface FornecedorRow {
  ano: number
  fornecedor_codigo: string
  fornecedor_nome: string
  classificacao: string
  movimentos: number
  credito: number
  debito: number
  saldo_final: number
  primeira_data: string
  ultima_data: string
}

function getFornecedoresDir(municipio = "sorocaba"): string {
  return path.join(DATA_PUBLIC_ROOT, municipio, "fornecedores", "saida")
}

function parseFornecedoresCSV(content: string, ano: number): FornecedorRow[] {
  const lines = content.split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "" : "")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      ano,
      fornecedor_codigo: g(f, col("fornecedor_codigo")).trim(),
      fornecedor_nome:   g(f, col("fornecedor_nome")).trim(),
      classificacao:     g(f, col("classificacao_inicial")).trim(),
      movimentos:        parseInt(g(f, col("movimentos"))) || 0,
      credito:           parseFloat(g(f, col("credito_num"))) || 0,
      debito:            parseFloat(g(f, col("debito_num"))) || 0,
      saldo_final:       parseFloat(g(f, col("saldo_final_num"))) || 0,
      primeira_data:     g(f, col("primeira_data")).trim(),
      ultima_data:       g(f, col("ultima_data")).trim(),
    }
  }).filter((r) => r.fornecedor_nome && r.classificacao !== "movimentacao_interna")
}

export function getAvailableYearsFornecedores(municipio = "sorocaba"): number[] {
  const dir = getFornecedoresDir(municipio)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .map((f) => f.match(new RegExp(`^fornecedores_agregado_${municipio}_(\\d{4})\\.csv$`)))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]))
    .sort((a, b) => b - a)
}

export function loadFornecedores(year: number, municipio = "sorocaba"): FornecedorRow[] {
  const filePath = path.join(getFornecedoresDir(municipio), `fornecedores_agregado_${municipio}_${year}.csv`)
  if (!fs.existsSync(filePath)) return []
  return parseFornecedoresCSV(fs.readFileSync(filePath, "utf-8"), year)
}

// ─── Emendas Impositivas (CEPA) ───────────────────────────────────────────────

export interface EmendaParlamentarRow {
  nome_parlamentar: string
  qtd_emendas: number
  valor: number
  empenhado: number
  liquidado: number
  pago: number
}

export interface EmendaAnoRow {
  ano: number
  qtd_emendas: number
  valor: number
  empenhado: number
  liquidado: number
  pago: number
}

function getEmendasDir(municipio = "sorocaba"): string {
  return path.join(DATA_PUBLIC_ROOT, municipio, "emendas", "saida")
}

export function loadEmendasPorParlamentar(municipio = "sorocaba"): EmendaParlamentarRow[] {
  const filePath = path.join(getEmendasDir(municipio), "emendas_cepa_por_parlamentar_sorocaba.csv")
  if (!fs.existsSync(filePath)) return []
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "" : "")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      nome_parlamentar: g(f, col("nome_parlamentar")).trim(),
      qtd_emendas:      parseInt(g(f, col("qtd_emendas"))) || 0,
      valor:            parseFloat(g(f, col("valor"))) || 0,
      empenhado:        parseFloat(g(f, col("empenhado"))) || 0,
      liquidado:        parseFloat(g(f, col("liquidado"))) || 0,
      pago:             parseFloat(g(f, col("pago"))) || 0,
    }
  }).filter((r) => r.nome_parlamentar)
}

export function loadEmendasPorAno(municipio = "sorocaba"): EmendaAnoRow[] {
  const filePath = path.join(getEmendasDir(municipio), "emendas_cepa_por_ano_sorocaba.csv")
  if (!fs.existsSync(filePath)) return []
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  const g = (f: string[], i: number) => (i >= 0 ? f[i] ?? "" : "")
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line)
    return {
      ano:         parseInt(g(f, col("ano"))) || 0,
      qtd_emendas: parseInt(g(f, col("qtd_emendas"))) || 0,
      valor:       parseFloat(g(f, col("valor"))) || 0,
      empenhado:   parseFloat(g(f, col("empenhado"))) || 0,
      liquidado:   parseFloat(g(f, col("liquidado"))) || 0,
      pago:        parseFloat(g(f, col("pago"))) || 0,
    }
  }).filter((r) => r.ano > 0).sort((a, b) => a.ano - b.ano)
}
