// Dados de fluxo financeiro para /fluxo-financeiro
// Fonte: RREO 2024 (6º bimestre) — Tesouro Nacional / SICONFI
//   Anexo 01 → receita por natureza (Arrecadado_Acumulado)
//   Anexo 02 → despesa por função (Liquidado)
// Valores em R$ milhões arredondados.
// Receita ajustada proporcionalmente para igualar total liquidado (5.108 M),
// eliminando o superávit de ~59 M sem distorcer as proporções relativas.

export type FluxoSankeyNode = {
  name: string        // obrigatório pelo Recharts
  shortName: string
  side: "source" | "center" | "use"
  color: string
  valueM: number      // R$ milhões
}

export type FluxoSankeyLink = {
  source: number
  target: number
  value: number
}

export type FluxoSankeyData = {
  nodes: FluxoSankeyNode[]
  links: FluxoSankeyLink[]
}

export type FluxoMunicipioEntry = {
  id: string
  nome: string
  uf: string
  status: "live" | "pending"
  anoReferencia: number
  totalReceitaM: number
  totalLiquidadoM: number
  fonte: string
  data: FluxoSankeyData
}

// ─── Sorocaba 2024 ────────────────────────────────────────────────────────────
// Índices dos nós:
//   0 União Federal · 1 Estado SP · 2 Rec. Própria · 3 Outros Recursos
//   4 Sorocaba/SP (centro)
//   5 Saúde · 6 Educação · 7 Previdência · 8 Saneamento
//   9 Transporte · 10 Administração · 11 Demais
const SOROCABA_2024: FluxoMunicipioEntry = {
  id: "sorocaba",
  nome: "Sorocaba",
  uf: "SP",
  status: "live",
  anoReferencia: 2024,
  totalReceitaM: 5167,
  totalLiquidadoM: 5108,
  fonte:
    "RREO 2024 (6º bimestre) — Tesouro Nacional / SICONFI · Anexo 01 (receita) e Anexo 02 (despesa por função executivo + legislativo)",
  data: {
    nodes: [
      // ── Fontes (esquerda) ──────────────────────────────────────────────────
      {
        name: "Transferências da União",
        shortName: "União Federal",
        side: "source",
        color: "#4589ff",
        valueM: 434,
      },
      {
        name: "Transferências do Estado de SP",
        shortName: "Estado de SP",
        side: "source",
        color: "#a78bfa",
        valueM: 990,
      },
      {
        name: "Receita Própria (tributos e contribuições)",
        shortName: "Rec. Própria",
        side: "source",
        color: "#42be65",
        valueM: 1904,
      },
      {
        name: "Outros recursos (patrimonial, serviços, capital, fundos públicos)",
        shortName: "Outros Recursos",
        side: "source",
        color: "#78716c",
        valueM: 1780,
      },
      // ── Centro ────────────────────────────────────────────────────────────
      {
        name: "Sorocaba/SP — orçamento municipal 2024",
        shortName: "Sorocaba/SP",
        side: "center",
        color: "#0f62fe",
        valueM: 5108,
      },
      // ── Gastos (direita) ──────────────────────────────────────────────────
      {
        name: "Saúde",
        shortName: "Saúde",
        side: "use",
        color: "#ff8389",
        valueM: 1048,
      },
      {
        name: "Educação",
        shortName: "Educação",
        side: "use",
        color: "#74b3f7",
        valueM: 1070,
      },
      {
        name: "Previdência Social",
        shortName: "Previdência",
        side: "use",
        color: "#c4b5fd",
        valueM: 584,
      },
      {
        name: "Saneamento",
        shortName: "Saneamento",
        side: "use",
        color: "#67e8f9",
        valueM: 602,
      },
      {
        name: "Transporte",
        shortName: "Transporte",
        side: "use",
        color: "#fcd34d",
        valueM: 576,
      },
      {
        name: "Administração",
        shortName: "Administração",
        side: "use",
        color: "#9ca3af",
        valueM: 626,
      },
      {
        name: "Demais funções (urbanismo, legislativo, segurança pública, assistência social e outros)",
        shortName: "Demais",
        side: "use",
        color: "#525252",
        valueM: 602,
      },
    ],
    links: [
      // Fontes → Sorocaba
      { source: 0, target: 4, value: 434 },
      { source: 1, target: 4, value: 990 },
      { source: 2, target: 4, value: 1904 },
      { source: 3, target: 4, value: 1780 },
      // Sorocaba → Gastos
      { source: 4, target: 5,  value: 1048 },
      { source: 4, target: 6,  value: 1070 },
      { source: 4, target: 7,  value: 584  },
      { source: 4, target: 8,  value: 602  },
      { source: 4, target: 9,  value: 576  },
      { source: 4, target: 10, value: 626  },
      { source: 4, target: 11, value: 602  },
    ],
  },
}

export const FLUXO_MUNICIPIOS: FluxoMunicipioEntry[] = [
  SOROCABA_2024,
  {
    id: "paulinia",
    nome: "Paulínia",
    uf: "SP",
    status: "pending",
    anoReferencia: 0,
    totalReceitaM: 0,
    totalLiquidadoM: 0,
    fonte: "",
    data: { nodes: [], links: [] },
  },
]
