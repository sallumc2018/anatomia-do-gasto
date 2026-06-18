import fs from "fs"
import path from "path"

export interface Agente {
  id: string
  nome: string
  nome_publico?: string
  cargo: string
  partido: string
  grupo: "executivo" | "legislativo"
  mandato: string
  salario_bruto: number
  verba_gabinete: number | null
  fonte_subsidio: string
}

const DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public", "auditoria")

function readJSON<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

export function getAgentes(): Agente[] {
  return readJSON<Agente[]>("agentes.json")
}

export function getAgentesPorGrupo(): { executivo: Agente[]; legislativo: Agente[] } {
  const agentes = getAgentes()
  return {
    executivo: agentes.filter((a) => a.grupo === "executivo"),
    legislativo: agentes.filter((a) => a.grupo === "legislativo").sort((a, b) => b.salario_bruto - a.salario_bruto),
  }
}

export function getCustoMensalTotal(): number {
  return getAgentes().reduce((sum, a) => sum + a.salario_bruto, 0)
}

export interface RankingItem {
  agente_id: string
  pontuacao: number
  criterios_positivos: string[]
  criterios_negativos: string[]
}

export function getRanking(): RankingItem[] {
  return readJSON<RankingItem[]>("ranking.json")
}
