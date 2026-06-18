// Registro central dos municípios cobertos pelo portal.
// Fonte única de verdade para o header (seletor de cidade + navegação) e
// qualquer componente que precise saber quais rotas existem por município.
//
// `rotas` lista APENAS os segmentos com escopo de município que realmente
// têm página publicada (app/<id>/<rota>/page.tsx). O header filtra os links
// por esta lista para nunca gerar um link para rota inexistente (404).

export type MunicipioId = "sorocaba" | "paulinia" | "sao-paulo"

export type MunicipioInfo = {
  id: MunicipioId
  nome: string
  uf: string
  rotas: readonly string[]
}

export const MUNICIPIOS: readonly MunicipioInfo[] = [
  {
    id: "sorocaba",
    nome: "Sorocaba",
    uf: "SP",
    rotas: [
      "executivo",
      "camara-municipal",
      "saude",
      "dados",
      "receita",
      "execucao",
      "fornecedores",
      "saude-fiscal",
      "educacao",
      "seguranca",
      "transporte",
      "auditoria",
      "pacto-federativo",
      "controle-externo",
      "emendas",
      "lacunas",
      "acesso-a-informacao",
      "transferencias",
      "autarquias",
    ],
  },
  {
    id: "paulinia",
    nome: "Paulínia",
    uf: "SP",
    rotas: ["executivo", "receita", "saude-fiscal", "seguranca", "transferencias", "transporte"],
  },
  {
    id: "sao-paulo",
    nome: "São Paulo",
    uf: "SP",
    rotas: ["executivo", "receita", "saude-fiscal", "seguranca", "transporte", "transferencias"],
  },
]

export const MUNICIPIO_PADRAO: MunicipioId = "sorocaba"

export function getMunicipio(id: MunicipioId): MunicipioInfo {
  return MUNICIPIOS.find((m) => m.id === id) ?? MUNICIPIOS[0]
}

// Deriva o município ativo a partir do primeiro segmento do pathname.
// Páginas globais (/, /sobre, /fluxo, /metodologia…) não têm município no
// caminho — nesses casos retorna o município padrão como contexto de navegação.
export function municipioAtivo(pathname: string | null | undefined): MunicipioId {
  if (!pathname) return MUNICIPIO_PADRAO
  const primeiro = pathname.split("/").filter(Boolean)[0]
  const encontrado = MUNICIPIOS.find((m) => m.id === primeiro)
  return encontrado ? encontrado.id : MUNICIPIO_PADRAO
}

export function temRota(id: MunicipioId, rota: string): boolean {
  return getMunicipio(id).rotas.includes(rota)
}
