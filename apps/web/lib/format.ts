/**
 * Tipos, constantes e funções de formatação sem dependências Node.js (fs/path).
 * Seguro para importar em client components.
 * Server components devem continuar importando de @/lib/data.
 */

export type HealthArea = "saude" | "educacao"

export type Area = "saude" | "educacao" | "seguranca" | "transporte"

export interface HealthRow {
  funcao: string
  dotacao: number
  empenhada: number
  liquidada: number
  paga: number
  quadrimestre: number
  fonte_pdf: string
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
