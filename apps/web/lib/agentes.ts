import fs from "fs"
import path from "path"

export interface FontePublica {
  id: string
  titulo: string
  url: string
}

export interface PessoaPublica {
  nome: string
  nome_publico?: string
  cargo: string
  partido?: string
  mandato?: string
  fonte_id?: string
  remuneracao?: {
    valor_bruto_mensal: number
    moeda: "BRL"
    tipo: string
    fonte_id: string
    nota: string
  }
}

export interface GrupoPublico {
  id: string
  titulo: string
  escopo: string
  observacao?: string
  pessoas: PessoaPublica[]
}

export interface PoderPublicoMunicipal {
  municipio: string
  uf: string
  atualizado_em: string
  observacao: string
  fontes: FontePublica[]
  grupos: GrupoPublico[]
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

export function getPoderPublicoSorocaba(): PoderPublicoMunicipal {
  const filePath = path.join(
    findRepoRoot(process.cwd()),
    "data",
    "public",
    "agentes",
    "poder_publico_sorocaba.json"
  )

  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as PoderPublicoMunicipal
}
