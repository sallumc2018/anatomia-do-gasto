/**
 * Leitura dos manifestos do Sprint 2 — compartilhada entre /municipios (indice
 * por UF) e /municipios/[uf] (lista de uma UF).
 *
 * POR QUE ESTE MODULO EXISTE
 * A pagina /municipios renderizava os 5.549 municipios numa lista so, com um
 * card por municipio e um link de download por CSV. Medido em producao em
 * 15/08/2026: 2.869.564 bytes de HTML (2,74 MiB) para apenas 417 municipios —
 * ~6.888 bytes cada. Projetado para os 5.549 da cobertura nacional daria cerca
 * de 36 MiB numa unica pagina. Quebrar por UF poe o pior caso (MG, 853) em
 * ~1,4 MiB.
 *
 * NOMES: vem do CSV do IBGE, nao de mapa mantido a mao.
 * A versao anterior tinha um NOME_OVERRIDE com ~40 entradas para acentuacao,
 * mais um capitalizeKey() de heuristica. Nao escala para 5.549 e produz
 * "Sao Joao" onde deveria "São João". O
 * data/manifests/ibge_municipios_completo.csv ja traz nome acentuado, UF e
 * regiao para os 5.571 — usar a fonte elimina a manutencao manual e o erro.
 */
import fs from "fs"
import path from "path"

// turbopackIgnore precisa estar DENTRO do path.join() que contem process.cwd(),
// para o Turbopack nao rastrear data/ inteiro para dentro de cada Lambda.
const DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data")
const MANIFESTS_SPRINT2 = path.join(DATA_DIR, "manifests", "sprint2")
const IBGE_CSV = path.join(DATA_DIR, "manifests", "ibge_municipios_completo.csv")

export const AREAS_ORDEM = [
  "transferencias_federais",
  "emendas_federais",
  "fns",
  "executivo",
  "fiscal",
  "receita",
]

export const AREA_LABELS: Record<string, string> = {
  emendas_federais: "Emendas",
  fns: "Saúde FNS",
  transferencias_federais: "Transferências",
  executivo: "Orçamento",
  fiscal: "Fiscal LRF",
  receita: "Receitas",
}

export const UF_META: Record<string, { nome: string; regiao: string }> = {
  AC: { nome: "Acre", regiao: "Norte" },
  AL: { nome: "Alagoas", regiao: "Nordeste" },
  AM: { nome: "Amazonas", regiao: "Norte" },
  AP: { nome: "Amapá", regiao: "Norte" },
  BA: { nome: "Bahia", regiao: "Nordeste" },
  CE: { nome: "Ceará", regiao: "Nordeste" },
  DF: { nome: "Distrito Federal", regiao: "Centro-Oeste" },
  ES: { nome: "Espírito Santo", regiao: "Sudeste" },
  GO: { nome: "Goiás", regiao: "Centro-Oeste" },
  MA: { nome: "Maranhão", regiao: "Nordeste" },
  MG: { nome: "Minas Gerais", regiao: "Sudeste" },
  MS: { nome: "Mato Grosso do Sul", regiao: "Centro-Oeste" },
  MT: { nome: "Mato Grosso", regiao: "Centro-Oeste" },
  PA: { nome: "Pará", regiao: "Norte" },
  PB: { nome: "Paraíba", regiao: "Nordeste" },
  PE: { nome: "Pernambuco", regiao: "Nordeste" },
  PI: { nome: "Piauí", regiao: "Nordeste" },
  PR: { nome: "Paraná", regiao: "Sul" },
  RJ: { nome: "Rio de Janeiro", regiao: "Sudeste" },
  RN: { nome: "Rio Grande do Norte", regiao: "Nordeste" },
  RO: { nome: "Rondônia", regiao: "Norte" },
  RR: { nome: "Roraima", regiao: "Norte" },
  RS: { nome: "Rio Grande do Sul", regiao: "Sul" },
  SC: { nome: "Santa Catarina", regiao: "Sul" },
  SE: { nome: "Sergipe", regiao: "Nordeste" },
  SP: { nome: "São Paulo", regiao: "Sudeste" },
  TO: { nome: "Tocantins", regiao: "Norte" },
}

export const ORDEM_REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]

export interface MunicipioInfo {
  key: string
  ibge: string
  uf: string
  nome: string
  areas: { area: string; csvs: string[] }[]
  arquivos_total: number
}

interface Sprint2ManifestFile {
  arquivo?: string
  municipio_ibge?: string | number
}

interface Sprint2Manifest {
  area?: string
  arquivos?: Sprint2ManifestFile[]
}

interface DadosIbge {
  nome: string
  uf: string
}

/** key (snake_case) -> { nome acentuado, uf }, lido do CSV oficial do IBGE. */
function carregarIbge(): Map<string, DadosIbge> {
  const mapa = new Map<string, DadosIbge>()
  if (!fs.existsSync(IBGE_CSV)) return mapa
  const linhas = fs.readFileSync(IBGE_CSV, "utf-8").split("\n")
  const cabecalho = linhas[0]?.split(",") ?? []
  const iNome = cabecalho.indexOf("nome")
  const iUf = cabecalho.indexOf("uf")
  const iKey = cabecalho.indexOf("key")
  if (iNome < 0 || iUf < 0 || iKey < 0) return mapa
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue
    // O CSV do IBGE nao tem virgula dentro de campo (nomes nao usam virgula),
    // entao split simples basta e evita puxar um parser para uma coluna.
    const cols = linha.split(",")
    const key = cols[iKey]?.trim()
    if (!key) continue
    mapa.set(key, { nome: cols[iNome]?.trim() ?? key, uf: cols[iUf]?.trim() ?? "" })
  }
  return mapa
}

/** Fallback quando a key nao esta no CSV: title-case respeitando conectivos. */
function nomeDaKey(key: string): string {
  const minusculas = new Set(["do", "da", "de", "dos", "das", "e"])
  return key
    .split("_")
    .map((p, i) => (i === 0 || !minusculas.has(p) ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ")
}

/** Le os manifestos de um municipio e devolve o IBGE e os CSVs por area. */
function lerManifestos(
  dir: string,
  manifestos: string[]
): { codigoIbge: string; csvsPorArea: Map<string, string[]> } {
  let codigoIbge = ""
  const csvsPorArea = new Map<string, string[]>()
  for (const nomeArquivo of manifestos) {
    try {
      const manifesto = JSON.parse(
        fs.readFileSync(path.join(/*turbopackIgnore: true*/ dir, nomeArquivo), "utf-8")
      ) as Sprint2Manifest
      const area = manifesto.area ?? nomeArquivo.replace(/\.json$/, "")
      const csvs = (manifesto.arquivos ?? [])
        .map((a) => a.arquivo)
        .filter((a): a is string => Boolean(a?.endsWith(".csv")))
        .sort()
      if (!codigoIbge) {
        const bruto = manifesto.arquivos?.find((a) => a.municipio_ibge)?.municipio_ibge
        if (bruto !== undefined && bruto !== null) codigoIbge = String(bruto)
      }
      if (csvs.length) csvsPorArea.set(area, csvs)
    } catch {
      // Manifesto ilegivel nao derruba a pagina inteira: o municipio aparece
      // com as areas que deram certo. Falhar em silencio aqui e melhor do que
      // uma pagina 500 por um JSON truncado durante uma coleta.
      continue
    }
  }
  return { codigoIbge, csvsPorArea }
}

/** AREAS_ORDEM primeiro, na ordem declarada; o que nao estiver nela vai ao fim. */
function ordenarAreas(csvsPorArea: Map<string, string[]>) {
  const areas = AREAS_ORDEM.filter((a) => csvsPorArea.has(a)).map((a) => ({
    area: a,
    csvs: csvsPorArea.get(a) ?? [],
  }))
  for (const [area, csvs] of csvsPorArea) {
    if (!AREAS_ORDEM.includes(area)) areas.push({ area, csvs })
  }
  return areas
}

/**
 * Le todos os manifestos do Sprint 2.
 *
 * Roda em build (as paginas sao estaticas), nao por requisicao. Sao ~5 leituras
 * de JSON por municipio; com 5.549 municipios isso e trabalho de build, e nao
 * custo de quem acessa o site.
 */
export function carregarMunicipios(): MunicipioInfo[] {
  if (!fs.existsSync(MANIFESTS_SPRINT2)) return []
  const ibge = carregarIbge()

  // turbopackIgnore tambem nos joins DINAMICOS, nao so no que tem process.cwd().
  // Sem isto o Turbopack avisa que o padrao casa 71.752 arquivos ("Overly broad
  // patterns can lead to build performance issues and over bundling") e tenta
  // rastrear data/manifests/sprint2 inteiro para dentro da saida.
  const keys = fs.readdirSync(MANIFESTS_SPRINT2).filter((d) => {
    if (d.startsWith("_")) return false
    return fs.statSync(path.join(/*turbopackIgnore: true*/ MANIFESTS_SPRINT2, d)).isDirectory()
  })

  const resultado: MunicipioInfo[] = []

  for (const key of keys) {
    const dir = path.join(/*turbopackIgnore: true*/ MANIFESTS_SPRINT2, key)
    const manifestos = fs.readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith(".json"))
    if (!manifestos.length) continue

    const { codigoIbge, csvsPorArea } = lerManifestos(dir, manifestos)
    if (!csvsPorArea.size) continue
    const areas = ordenarAreas(csvsPorArea)
    const doIbge = ibge.get(key)
    resultado.push({
      key,
      ibge: codigoIbge,
      uf: doIbge?.uf ?? "",
      nome: doIbge?.nome ?? nomeDaKey(key),
      areas,
      arquivos_total: areas.reduce((acc, a) => acc + a.csvs.length, 0),
    })
  }

  return resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

/**
 * Le UM municipio pela key, sem varrer os 5.549.
 *
 * A pagina de municipio e gerada sob demanda: varrer o diretorio inteiro a
 * cada primeira visita seria ~25 mil leituras de JSON para montar uma pagina
 * que usa uma. Aqui sao ~5 leituras — as do proprio municipio.
 */
export function carregarMunicipio(key: string): MunicipioInfo | null {
  if (!/^[a-z0-9][a-z0-9_]*$/.test(key)) return null
  const dir = path.join(/*turbopackIgnore: true*/ MANIFESTS_SPRINT2, key)
  if (!fs.existsSync(dir) || !fs.statSync(/*turbopackIgnore: true*/ dir).isDirectory()) return null

  const manifestos = fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => f.endsWith(".json"))
  if (!manifestos.length) return null

  const { codigoIbge, csvsPorArea } = lerManifestos(dir, manifestos)
  if (!csvsPorArea.size) return null

  const doIbge = carregarIbge().get(key)
  const areas = ordenarAreas(csvsPorArea)
  return {
    key,
    ibge: codigoIbge,
    uf: doIbge?.uf ?? "",
    nome: doIbge?.nome ?? nomeDaKey(key),
    areas,
    arquivos_total: areas.reduce((acc, a) => acc + a.csvs.length, 0),
  }
}

export interface ResumoUf {
  uf: string
  nome: string
  regiao: string
  municipios: number
  arquivos: number
}

/** Agrupa por UF, ordenado por regiao e depois por nome do estado. */
export function resumirPorUf(municipios: MunicipioInfo[]): ResumoUf[] {
  const porUf = new Map<string, MunicipioInfo[]>()
  for (const m of municipios) {
    if (!m.uf) continue
    const lista = porUf.get(m.uf) ?? []
    lista.push(m)
    porUf.set(m.uf, lista)
  }
  return [...porUf.entries()]
    .map(([uf, lista]) => ({
      uf,
      nome: UF_META[uf]?.nome ?? uf,
      regiao: UF_META[uf]?.regiao ?? "",
      municipios: lista.length,
      arquivos: lista.reduce((acc, m) => acc + m.arquivos_total, 0),
    }))
    .sort((a, b) => {
      const ia = ORDEM_REGIOES.indexOf(a.regiao)
      const ib = ORDEM_REGIOES.indexOf(b.regiao)
      if (ia !== ib) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
      return a.nome.localeCompare(b.nome, "pt-BR")
    })
}

export function municipiosDaUf(municipios: MunicipioInfo[], uf: string): MunicipioInfo[] {
  const alvo = uf.toUpperCase()
  return municipios.filter((m) => m.uf === alvo)
}
