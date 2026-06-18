export interface ItemAprendizado {
  curso: string
  instituicao: string
  status: "concluído" | "em andamento"
  data?: string
  aplicacao: string
}

export const APRENDIZADO: ItemAprendizado[] = [
  {
    curso: "Fundamentos de Deep Learning: Conceitos e Implementações em Python",
    instituicao: "Ocean Brasil / Samsung",
    status: "concluído",
    data: "mai/2026",
    aplicacao: "Base para identificar padrões anômalos em séries históricas de gasto público.",
  },
  {
    curso: "Análise de Dados com Python",
    instituicao: "Impacta",
    status: "em andamento",
    aplicacao: "Fundação dos pipelines de extração e validação dos datasets publicados.",
  },
  {
    curso: "Fundamentos para Análise de Dados",
    instituicao: "Microsoft / LinkedIn Learning",
    status: "em andamento",
    aplicacao: "Metodologia de validação e apresentação dos dados ao cidadão.",
  },
]
