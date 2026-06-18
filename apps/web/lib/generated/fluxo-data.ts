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

// ─── Paulínia 2024 ───────────────────────────────────────────────────────────
// Receita total: R$ 2.995 M (RREO Anexo 01 · SICONFI · IBGE 3536505)
// Liquidado total: R$ 2.586 M (RREO Anexo 02 · SICONFI)
// Fontes: União 138M, Estado SP 1.586M, Rec. Própria 890M, Outros 203M
// Destinos: Educação 625M, Saúde 537M, Previdência 272M, Encargos Esp. 256M,
//           Urbanismo 253M, Transporte 154M, Demais 489M
// Fontes escaladas proporcionalmente (× 2.586/2.816) para igualar total liquidado.
// Nós: 0=União · 1=Estado SP · 2=Rec.Própria · 3=Outros · 4=Paulínia
//      5=Educação · 6=Saúde · 7=Previdência · 8=Encargos Esp.
//      9=Urbanismo · 10=Transporte · 11=Demais
const PAULINIA_2024: FluxoMunicipioEntry = {
  id: "paulinia",
  nome: "Paulínia",
  uf: "SP",
  status: "live",
  anoReferencia: 2024,
  totalReceitaM: 2995,
  totalLiquidadoM: 2586,
  fonte:
    "RREO 2024 (6º bimestre) — Tesouro Nacional / SICONFI · Anexo 01 (receita) e Anexo 02 (despesa por função executivo + legislativo + RPPS) · IBGE 3536505",
  data: {
    nodes: [
      // ── Fontes (esquerda) ──────────────────────────────────────────────────
      { name: "Transferências da União",            shortName: "União Federal", side: "source", color: "#4589ff", valueM: 138 },
      { name: "Transferências do Estado de SP",     shortName: "Estado de SP",  side: "source", color: "#a78bfa", valueM: 1586 },
      { name: "Receita Própria (tributos e royalties)", shortName: "Rec. Própria", side: "source", color: "#42be65", valueM: 890 },
      { name: "Outras fontes (patrimonial, serviços, capital)", shortName: "Outros", side: "source", color: "#f1c21b", valueM: 203 },
      // ── Centro ────────────────────────────────────────────────────────────
      { name: "Paulínia/SP", shortName: "Paulínia", side: "center", color: "#0f62fe", valueM: 2586 },
      // ── Usos (direita) ────────────────────────────────────────────────────
      { name: "Educação",          shortName: "Educação",     side: "use", color: "#0f62fe", valueM: 625 },
      { name: "Saúde",             shortName: "Saúde",        side: "use", color: "#4589ff", valueM: 537 },
      { name: "Previdência Social", shortName: "Previdência", side: "use", color: "#78a9ff", valueM: 272 },
      { name: "Encargos Especiais", shortName: "Encargos",    side: "use", color: "#a6c8ff", valueM: 256 },
      { name: "Urbanismo",         shortName: "Urbanismo",    side: "use", color: "#6f6f6f", valueM: 253 },
      { name: "Transporte",        shortName: "Transporte",   side: "use", color: "#525252", valueM: 154 },
      { name: "Demais funções",    shortName: "Demais",       side: "use", color: "#393939", valueM: 489 },
    ],
    links: [
      // fontes → Paulínia (escaladas: × 2586/2816 ≈ 0.918)
      { source: 0, target: 4, value: 127  },
      { source: 1, target: 4, value: 1457 },
      { source: 2, target: 4, value: 817  },
      { source: 3, target: 4, value: 185  },
      // Paulínia → destinos
      { source: 4, target: 5,  value: 625 },
      { source: 4, target: 6,  value: 537 },
      { source: 4, target: 7,  value: 272 },
      { source: 4, target: 8,  value: 256 },
      { source: 4, target: 9,  value: 253 },
      { source: 4, target: 10, value: 154 },
      { source: 4, target: 11, value: 489 },
    ],
  },
}

// ─── São Paulo 2024 ──────────────────────────────────────────────────────────
// Receita arrecadada: R$ 117.011 M (RREO Anexo 01 · Arrecadado_Acumulado · id_ente 3550308)
// Liquidado total: R$ 117.331 M (RREO Anexo 02 · Liquidado por função, Poder Executivo co_poder=E)
// Fontes (arrecadado): União 4.766M, Estado SP 12.173M, Receita Própria (tributária+contribuições) 65.953M, Outros 34.118M
// Destinos (liquidado): Educação 26.111M, Saúde 22.779M, Previdência 20.298M, Transporte 10.565M,
//                       Urbanismo 10.262M, Habitação 4.915M, Administração 4.697M, Demais 17.706M
// Fontes escaladas proporcionalmente (× 117.331/117.011 ≈ 1.00274) para igualar total liquidado.
// Nós: 0=União · 1=Estado SP · 2=Rec.Própria · 3=Outros · 4=São Paulo
//      5=Educação · 6=Saúde · 7=Previdência · 8=Transporte · 9=Urbanismo
//      10=Habitação · 11=Administração · 12=Demais
const SAO_PAULO_2024: FluxoMunicipioEntry = {
  id: "sao-paulo",
  nome: "São Paulo",
  uf: "SP",
  status: "live",
  anoReferencia: 2024,
  totalReceitaM: 117011,
  totalLiquidadoM: 117331,
  fonte:
    "RREO 2024 (6º bimestre) — Tesouro Nacional / SICONFI · Anexo 01 (receita arrecadada) e Anexo 02 (despesa liquidada por função, Poder Executivo — co_poder=E) · id_ente 3550308 (Município de São Paulo)",
  data: {
    nodes: [
      // ── Fontes (esquerda) ──────────────────────────────────────────────────
      { name: "Transferências da União",                shortName: "União Federal", side: "source", color: "#4589ff", valueM: 4779 },
      { name: "Transferências do Estado de SP",         shortName: "Estado de SP",  side: "source", color: "#a78bfa", valueM: 12207 },
      { name: "Receita Própria (tributos e contribuições)", shortName: "Rec. Própria", side: "source", color: "#42be65", valueM: 66134 },
      { name: "Outros recursos (patrimonial, serviços, capital, transferências de outras instituições, intra-orçamentárias)", shortName: "Outros Recursos", side: "source", color: "#78716c", valueM: 34212 },
      // ── Centro ────────────────────────────────────────────────────────────
      { name: "São Paulo/SP — orçamento municipal 2024", shortName: "São Paulo/SP", side: "center", color: "#0f62fe", valueM: 117331 },
      // ── Usos (direita) ────────────────────────────────────────────────────
      { name: "Educação",           shortName: "Educação",     side: "use", color: "#74b3f7", valueM: 26111 },
      { name: "Saúde",              shortName: "Saúde",        side: "use", color: "#ff8389", valueM: 22779 },
      { name: "Previdência Social", shortName: "Previdência",  side: "use", color: "#c4b5fd", valueM: 20298 },
      { name: "Transporte",         shortName: "Transporte",   side: "use", color: "#fcd34d", valueM: 10565 },
      { name: "Urbanismo",          shortName: "Urbanismo",    side: "use", color: "#6f6f6f", valueM: 10262 },
      { name: "Habitação",          shortName: "Habitação",    side: "use", color: "#5eead4", valueM: 4915 },
      { name: "Administração",      shortName: "Administração", side: "use", color: "#9ca3af", valueM: 4697 },
      { name: "Demais funções (assistência social, saneamento, segurança pública, cultura, encargos especiais e outras)", shortName: "Demais", side: "use", color: "#525252", valueM: 17706 },
    ],
    links: [
      // Fontes → São Paulo
      { source: 0, target: 4, value: 4779  },
      { source: 1, target: 4, value: 12207 },
      { source: 2, target: 4, value: 66134 },
      { source: 3, target: 4, value: 34212 },
      // São Paulo → Usos
      { source: 4, target: 5,  value: 26111 },
      { source: 4, target: 6,  value: 22779 },
      { source: 4, target: 7,  value: 20298 },
      { source: 4, target: 8,  value: 10565 },
      { source: 4, target: 9,  value: 10262 },
      { source: 4, target: 10, value: 4915  },
      { source: 4, target: 11, value: 4697  },
      { source: 4, target: 12, value: 17706 },
    ],
  },
}

export const FLUXO_MUNICIPIOS: FluxoMunicipioEntry[] = [
  SOROCABA_2024,
  PAULINIA_2024,
  SAO_PAULO_2024,
]
