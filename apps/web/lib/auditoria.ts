import fs from "fs"
import path from "path"

export interface Agente {
  id: string
  nome: string
  cargo: string
  partido: string
  salario_bruto: number
  verba_gabinete: number | null
  emendas_disponiveis: number | null
}

export interface Emenda {
  agente_id: string
  ano: number
  entidade: string
  cnpj: string | null
  objeto: string
  valor_empenhado: number
  valor_liquidado: number
  valor_pago: number
  status: "pago" | "parcialmente_pago" | "pendente"
}

export interface RankingItem {
  agente_id: string
  pontuacao: number
  criterios_positivos: string[]
  criterios_negativos: string[]
}

export interface AgentePerfil extends Agente {
  total_empenhado: number
  total_pago: number
  taxa_execucao: number
  emendas: Emenda[]
  ranking?: RankingItem
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

const DATA_DIR = path.join(findRepoRoot(process.cwd()), "data", "public", "auditoria")

function readJSON<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

export function getAgentes(): Agente[] {
  return readJSON<Agente[]>("agentes.json")
}

export function getEmendas(): Emenda[] {
  return readJSON<Emenda[]>("emendas.json")
}

export function getRanking(): RankingItem[] {
  return readJSON<RankingItem[]>("ranking.json")
}

export function getPerfilAgente(id: string): AgentePerfil | null {
  const agentes = getAgentes()
  const emendas = getEmendas()
  const ranking = getRanking()

  const agente = agentes.find((a) => a.id === id)
  if (!agente) return null

  const emendasDoAgente = emendas.filter((e) => e.agente_id === id)
  const total_empenhado = emendasDoAgente.reduce((sum, e) => sum + e.valor_empenhado, 0)
  const total_pago = emendasDoAgente.reduce((sum, e) => sum + e.valor_pago, 0)
  const taxa_execucao = total_empenhado > 0 ? (total_pago / total_empenhado) * 100 : 0

  const rankingItem = ranking.find((r) => r.agente_id === id)

  return {
    ...agente,
    total_empenhado,
    total_pago,
    taxa_execucao,
    emendas: emendasDoAgente,
    ranking: rankingItem,
  }
}

export function getPerfisResumidos(): AgentePerfil[] {
  const agentes = getAgentes()
  return agentes
    .map((agente) => getPerfilAgente(agente.id)!)
    .filter(Boolean)
    .sort((a, b) => b.total_empenhado - a.total_empenhado)
}

export interface GrafoNo {
  id: string
  label: string
  group: "fonte" | "parlamentar" | "entidade"
  salario?: number
  cargo?: string
}

export interface GrafoAresta {
  source: string
  target: string
  label: string
  value?: number
}

export function getGrafoData(): { nos: GrafoNo[]; arestas: GrafoAresta[] } {
  const agentes = getAgentes()
  const emendas = getEmendas()

  const nos: GrafoNo[] = [
    { id: "cidadao", label: "Cidadão", group: "fonte" },
    ...agentes.map((a) => ({
      id: a.id,
      label: `${a.nome} (${a.cargo})`,
      group: "parlamentar" as const,
      salario: a.salario_bruto,
      cargo: a.cargo,
    })),
  ]

  const arestas: GrafoAresta[] = []
  agentes.forEach((a) => {
    arestas.push({
      source: "cidadao",
      target: a.id,
      label: `Subsídio: R$ ${a.salario_bruto.toLocaleString("pt-BR")}`,
      value: a.salario_bruto,
    })
  })

  emendas.forEach((e) => {
    const entidadeId = `ent-${e.entidade.replace(/\s+/g, "-").toLowerCase()}`
    if (!nos.find((n) => n.id === entidadeId)) {
      nos.push({ id: entidadeId, label: e.entidade, group: "entidade" })
    }
    arestas.push({
      source: e.agente_id,
      target: entidadeId,
      label: `${e.objeto} — R$ ${e.valor_empenhado.toLocaleString("pt-BR")}`,
      value: e.valor_empenhado,
    })
  })

  return { nos, arestas }
}
