export type Dimensao =
  | "executivo"
  | "contratos"
  | "camara"
  | "autarquias"
  | "transferencias"
  | "controle_externo"

export type Prioridade = "crítica" | "alta" | "média" | "baixa"
export type Status = "em_coleta" | "lacuna" | "inexistente" | "parcial" | "publicado"

export interface Lacuna {
  area: string
  dado: string
  status: Status
  prioridade: Prioridade
  anos: string
  fonte: string
  url: string
  proximo_passo: string
  observacao: string
  dimensao: Dimensao
  anosPossiveis: number
  anosCobertos: number
}

const STATUS_SCORE: Record<Status, number | null> = {
  publicado:    1.0,
  parcial:      0.5,
  em_coleta:    0.2,
  lacuna:       0.0,
  inexistente:  null, // excluído do denominador
}

export const DIMENSAO_PESO: Record<Dimensao, number> = {
  executivo:        0.30,
  contratos:        0.20,
  camara:           0.10,
  autarquias:       0.15,
  transferencias:   0.15,
  controle_externo: 0.10,
}

export const DIMENSAO_LABEL: Record<Dimensao, string> = {
  executivo:        "Executivo — orçamento e execução",
  contratos:        "Contratos, obras e fornecedores",
  camara:           "Câmara Municipal",
  autarquias:       "Autarquias e fundações",
  transferencias:   "Transferências e convênios",
  controle_externo: "Controle externo",
}

type ScoringItem = Pick<Lacuna, "dimensao" | "status" | "anosPossiveis" | "anosCobertos">

// Datasets publicados nas páginas de área — não aparecem na lista de lacunas
// (saúde, educação, segurança, transporte, receita, execução, saúde fiscal)
const COBERTURA_PUBLICADOS: ScoringItem[] = [
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // despesa por função
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // receita RREO
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // saúde fiscal RGF
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // saúde — gasto/mínimo
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // educação — gasto/mínimo
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // segurança pública
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // transporte — orçamento
  { dimensao: "executivo", status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // execução empenho/liq/pago
  { dimensao: "camara",    status: "publicado", anosPossiveis: 6, anosCobertos: 6 }, // vereadores, subsídio, custo
]

function scoreItem(item: ScoringItem): number | null {
  const base = STATUS_SCORE[item.status]
  if (base === null) return null
  const yf = item.anosPossiveis > 0 ? item.anosCobertos / item.anosPossiveis : 0
  return base * yf
}

export interface CoberturaDimensao {
  dimensao: Dimensao
  label: string
  peso: number
  score: number       // 0–1 dentro da dimensão
  contribuicao: number // score × peso
  publicados: number
  total: number
}

export function calcularCobertura(): { percent: number; dimensoes: CoberturaDimensao[] } {
  const acc = new Map<Dimensao, { soma: number; n: number; publicados: number }>()

  for (const item of [...LACUNAS, ...COBERTURA_PUBLICADOS]) {
    const s = scoreItem(item)
    if (s === null) continue
    const cur = acc.get(item.dimensao) ?? { soma: 0, n: 0, publicados: 0 }
    acc.set(item.dimensao, {
      soma: cur.soma + s,
      n: cur.n + 1,
      publicados: cur.publicados + (item.status === "publicado" ? 1 : 0),
    })
  }

  let total = 0
  const dimensoes: CoberturaDimensao[] = []

  for (const [dim, { soma, n, publicados }] of acc) {
    const score = n > 0 ? soma / n : 0
    const contribuicao = score * DIMENSAO_PESO[dim]
    total += contribuicao
    dimensoes.push({
      dimensao: dim,
      label: DIMENSAO_LABEL[dim],
      peso: DIMENSAO_PESO[dim],
      score,
      contribuicao,
      publicados,
      total: n,
    })
  }

  dimensoes.sort((a, b) => b.contribuicao - a.contribuicao)

  return { percent: Math.round(total * 100), dimensoes }
}

export const LACUNAS: Lacuna[] = [
  // ── Fornecedores ──────────────────────────────────────────────────────────
  {
    area: "Fornecedores",
    dado: "Conta-corrente de fornecedores 2022 e 2023",
    status: "publicado",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Verificar classificação automática e curar manualmente se necessário.",
    observacao: "PDFs de 1.4 GB (2022) e 1.5 GB (2023) baixados, extraídos e publicados em 2026-05-16. Todos os 6 anos 2020–2025 disponíveis.",
    dimensao: "contratos",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  {
    area: "Fornecedores",
    dado: "Restos a pagar por fornecedor 2020-2025",
    status: "publicado",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "Série completa 2020-2025 publicada em 2026-05-17. 2020: 644 movimentos, 239 fornecedores. 2021 R$451M (764 rec.), 2022 R$76M (663 rec.), 2023 R$57M (737 rec.), 2024 R$121M (759 rec.), 2025 R$157,1M (817 rec.).",
    dimensao: "contratos",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Contratos e licitações ─────────────────────────────────────────────────
  {
    area: "Contratos e licitações",
    dado: "Contratos, licitações e atas de registro de preços",
    status: "publicado",
    prioridade: "média",
    anos: "2023–2025",
    fonte: "Portal Nacional de Contratações Públicas (PNCP)",
    url: "https://www.gov.br/pncp/pt-br",
    proximo_passo: "Expandir para contratos (API retorna empty) e monitorar novos anos.",
    observacao: "Publicado em 2026-05-22: 294 registros únicos (136 compras/2023, 47 atas/2024, 111 atas/2025). Arquivo: data/public/sorocaba/contratos/saida/pncp_sorocaba_2022_2026.csv. Sorocaba não estava no PNCP em 2022 (HTTP 403 confirmado); anosPossiveis corrigido para 3.",
    dimensao: "contratos",
    anosPossiveis: 3,
    anosCobertos: 3,
  },
  {
    area: "Contratos e licitações",
    dado: "Contratos e licitações anteriores a 2022",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2021",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar links de contratos por ano no portal e extrair campos relevantes.",
    observacao: "Antes da Lei 14.133/2021, contratos publicados apenas no portal municipal.",
    dimensao: "contratos",
    anosPossiveis: 2,
    anosCobertos: 0,
  },
  // ── Obras públicas ─────────────────────────────────────────────────────────
  {
    area: "Obras públicas",
    dado: "Inventário de obras: objeto, empresa, valor, prazo e situação",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "PNCP + Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar obras no PNCP por objeto e cruzar com contratos e empenhos locais.",
    observacao: "Fonte secundária: TCE-SP (tce.sp.gov.br). Obras da Urbes têm portal próprio.",
    dimensao: "contratos",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Receita ────────────────────────────────────────────────────────────────
  {
    area: "Receita",
    dado: "Registro analítico da receita orçamentária (mensal)",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Baixar PDFs do Registro Analítico de Receita e extrair por conta e mês.",
    observacao: "Detalha receita por classificação contábil, além do agregado RREO já publicado.",
    dimensao: "executivo",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Despesa ────────────────────────────────────────────────────────────────
  {
    area: "Despesa",
    dado: "Registro analítico de empenhos (por nota de empenho)",
    status: "publicado",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "Série completa publicada em 2026-05-17: 2020 (18.490), 2021 (36.947), 2022 (40.104), 2023 (41.649), 2024 (34.597), 2025 (31.444) empenhos.",
    dimensao: "contratos",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  {
    area: "Despesa",
    dado: "Despesa orçamentária detalhada 2022 e 2023",
    status: "publicado",
    prioridade: "crítica",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Série completa 2020–2025 disponível.",
    observacao: "PDFs baixados e extraídos em 2026-05-17: 63.167 registros (2022) e 71.225 registros (2023). Sanidade: >99,8% válidos em ambos os anos.",
    dimensao: "executivo",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Orçamento ──────────────────────────────────────────────────────────────
  {
    area: "Orçamento",
    dado: "LOA - Audiência Pública: priorizações cidadãs por área e região",
    status: "publicado",
    prioridade: "alta",
    anos: "2022–2026",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Dados de 2022 contêm ranking de eixos; 2023–2025 por área e região; 2026 por eixo estratégico (schema diferente).",
    observacao: "Extraído por leitura visual (modelo multimodal) dos Relatórios de Audiência Pública em PDF. 2022: 140 participantes, ranking 4 eixos. 2023: 200 formulários. 2024: 163/414 propostas. 2025: 100/277 propostas. 2026: dados globais por eixo.",
    dimensao: "executivo",
    anosPossiveis: 5,
    anosCobertos: 5,
  },
  {
    area: "Orçamento",
    dado: "LOA - Audiência Pública 2020 e 2021: relatórios nunca publicados pela Prefeitura",
    status: "inexistente",
    prioridade: "baixa",
    anos: "2020–2021",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Nenhum. Dado confirmado como inexistente na fonte oficial.",
    observacao: "O portal fazenda.sorocaba.sp.gov.br/transparencia só publica relatórios de audiência pública da LOA a partir de 2022. Verificado em 2026-05-17.",
    dimensao: "executivo",
    anosPossiveis: 0,
    anosCobertos: 0,
  },
  // ── Câmara Municipal ───────────────────────────────────────────────────────
  {
    area: "Câmara Municipal",
    dado: "Emendas impositivas por vereador (autor, destino, valor, execução)",
    status: "publicado",
    prioridade: "crítica",
    anos: "2022–2025",
    fonte: "CEPA - Consulta de Emendas Parlamentares",
    url: "https://servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas",
    proximo_passo: "Publicado em 2026-05-22. Cobertura efetiva a partir de 2022 (CEPA não possui dados anteriores).",
    observacao: "API oficial coletada: 3.627 emendas, 3.741 dotações e 10.130 eventos. Cobertura 2022–2025.",
    dimensao: "camara",
    anosPossiveis: 6,
    anosCobertos: 4,
  },
  {
    area: "Câmara Municipal",
    dado: "Despesas de gabinete publicadas e contratos ainda pendentes por vereador",
    status: "parcial",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência da Câmara de Sorocaba",
    url: "https://www.camarasorocaba.sp.gov.br",
    proximo_passo: "Manter a série de gabinete publicada e inventariar contratos, licitações e demais despesas da Câmara.",
    observacao: "Despesas mensais de gabinete 2020-2026 já publicadas. Contratos, licitações e cruzamento por vereador continuam pendentes.",
    dimensao: "camara",
    anosPossiveis: 7,
    anosCobertos: 7,
  },
  {
    area: "Câmara Municipal",
    dado: "Execução orçamentária detalhada da Câmara (empenho/liquidação/pagamento)",
    status: "publicado",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência TCE-SP",
    url: "https://transparencia.tce.sp.gov.br",
    proximo_passo: "Cruzar com emendas por vereador e construir visão de gasto por programa/função.",
    observacao: "Publicado em 2026-05-22: 24.417 registros com empenho, liquidação, pagamento, anulações e reforços. Câmara gastou R$50–81M/ano (empenhos) em 2020-2025; total acumulado R$1,23B. Arquivo: data/public/sorocaba/camara/saida/camara_despesas_tce_2020_2025.csv.",
    dimensao: "camara",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  {
    area: "Câmara Municipal",
    dado: "Contratos e licitações da Câmara Municipal",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2026",
    fonte: "Portal de Transparência da Câmara de Sorocaba",
    url: "https://www.camarasorocaba.sp.gov.br",
    proximo_passo: "Inventariar contratos publicados no portal da Câmara e extrair campos estruturados.",
    observacao: "Câmara publica contratos no portal próprio, mas ainda não há dataset estruturado em data/public.",
    dimensao: "camara",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Urbes ──────────────────────────────────────────────────────────────────
  {
    area: "Urbes",
    dado: "Despesas mensais, contratos e remuneração do transporte público",
    status: "lacuna",
    prioridade: "crítica",
    anos: "2020–2026",
    fonte: "Portal de Transparência da Urbes",
    url: "https://www.urbes.com.br/transparencia/index",
    proximo_passo: "Normalizar os documentos inventariados por categoria e validar totais antes de qualquer publicação.",
    observacao: "Inventário e downloads oficiais avançaram em 2026-05-20, incluindo despesas, balancetes, RH, remuneração do transporte e contratos. Ainda não há dataset validado em data/public.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── SAAE ───────────────────────────────────────────────────────────────────
  {
    area: "SAAE",
    dado: "Receitas e despesas do saneamento (SAAE Sorocaba)",
    status: "publicado",
    prioridade: "média",
    anos: "2020–2025",
    fonte: "Portal de Transparência TCE-SP",
    url: "https://transparencia.tce.sp.gov.br",
    proximo_passo: "Complementar com contratos, obras e licitações via TDAPortal do SAAE. Atualizar para 2026 quando disponível.",
    observacao: "Publicado em 2026-05-22: 75.272 despesas (R$8B total) e 1.130 receitas (R$2,3B total) 2020–2025. Arquivos: saae_despesas_tce_2020_2025.csv e saae_receitas_tce_2020_2025.csv em data/public/sorocaba/autarquias/saida/.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── FUNSERV ────────────────────────────────────────────────────────────────
  {
    area: "FUNSERV",
    dado: "Demonstrativo RPPS — receitas, despesas e resultado da previdência",
    status: "publicado",
    prioridade: "média",
    anos: "2020–2025",
    fonte: "SICONFI / Tesouro Nacional — RREO Anexo 04",
    url: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo",
    proximo_passo: "Adicionar avaliação atuarial, investimentos e rentabilidade via portal FUNSERV (816 documentos inventariados em 2026-05-20).",
    observacao: "Publicado em 2026-05-22: 6 anos de receitas e despesas RPPS (RREO Anexo 04): R$177M→R$550M receitas/ano. Arquivo: data/public/sorocaba/autarquias/saida/funserv_rpps_sorocaba.csv. Detalhes atuariais e de investimentos ainda pendentes.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  {
    area: "FUNSERV",
    dado: "Despesas do fundo de assistência médica (FUNSERV Saúde)",
    status: "publicado",
    prioridade: "média",
    anos: "2020–2025",
    fonte: "Portal de Transparência TCE-SP",
    url: "https://transparencia.tce.sp.gov.br",
    proximo_passo: "Complementar com receitas (contribuições dos servidores) e cruzar com beneficiários e prestadores de saúde.",
    observacao: "Publicado em 2026-05-22: 9.154 registros de despesas do FUNSERV Assistência Médica 2020–2025. Gasto cresceu de R$121M (2020) para R$199M/ano (2025); total acumulado R$3,27B. Entidade distinta do FUNSERV Previdência (RPPS). Arquivo: data/public/sorocaba/autarquias/saida/funserv_saude_tce_2020_2025.csv.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Empresas municipais ───────────────────────────────────────────────────
  {
    area: "Empresas municipais",
    dado: "Despesas da EDUSS e do Parque Tecnológico de Sorocaba",
    status: "publicado",
    prioridade: "baixa",
    anos: "2020–2025",
    fonte: "Portal de Transparência TCE-SP",
    url: "https://transparencia.tce.sp.gov.br",
    proximo_passo: "Complementar com receitas e contratos. Adicionar Urbes quando disponível no TCE-SP.",
    observacao: "Publicado em 2026-05-22: 46.504 registros (EDUSS R$1,2B + Parque Tecnológico R$155M) 2020-2025. Arquivo: empresas_municipais_tce_2020_2025.csv em data/public/sorocaba/autarquias/saida/.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Consórcios ─────────────────────────────────────────────────────────────
  {
    area: "Consórcios intermunicipais",
    dado: "Despesas, contratos e repasses dos consórcios de que Sorocaba participa",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2026",
    fonte: "Portais dos consórcios + TCE-SP",
    url: "https://www.tce.sp.gov.br",
    proximo_passo: "Mapear quais consórcios Sorocaba integra (saúde, resíduos, transporte) e identificar portais de transparência.",
    observacao: "Dinheiro público sai da prefeitura mas a prestação de contas é do consórcio. Fonte alternativa: TCE-SP audita consórcios regionais.",
    dimensao: "autarquias",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Transferências federais ────────────────────────────────────────────────
  {
    area: "Transferências federais",
    dado: "Transferências individualizadas da União para Sorocaba",
    status: "publicado",
    prioridade: "baixa",
    anos: "2020–2025",
    fonte: "Portal de Transparência TCE-SP",
    url: "https://transparencia.tce.sp.gov.br",
    proximo_passo: "Manter atualização anual. Complementar com convênios SICONV (73 convênios, R$82M) disponíveis em arquivo separado.",
    observacao: "Publicado em 2026-05-22: 2.706 registros mensais por alínea (FPM R$445M + SUS R$1,2B + FNDE/FUNDEB R$2,3B + outros), total R$4,7B 2020-2025. Arquivo: transferencias_federais_tce_sorocaba.csv. Convênios SICONV em convenios_federais_sorocaba.csv.",
    dimensao: "transferencias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Transferências estaduais ───────────────────────────────────────────────
  {
    area: "Transferências estaduais",
    dado: "Transferências individualizadas do Estado de SP para Sorocaba",
    status: "publicado",
    prioridade: "baixa",
    anos: "2020–2026",
    fonte: "Sefaz-SP — RepasseConsulta",
    url: "https://www.fazenda.sp.gov.br/RepasseConsulta/Consulta/repasse.aspx",
    proximo_passo: "Adicionar CIDE e Fundo Estadual de Saúde (não incluídos na RepasseConsulta). Manter atualização anual via script.",
    observacao: "Publicado em 2026-05-22: 84 registros mensais 2020–2026 (ICMS+IPVA+FundExpIPI+compensações). Totais: R$600M (2020) → R$1,06B (2025). Arquivo: data/public/sorocaba/transferencias/saida/transferencias_estaduais_sp_sorocaba.csv.",
    dimensao: "transferencias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Subvenções a entidades ─────────────────────────────────────────────────
  {
    area: "Subvenções e auxílios",
    dado: "Repasses a OSCs, associações, clubes e entidades privadas",
    status: "publicado",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Publicado. Cruzar fornecedor_nome com CNPJ da conta-corrente para identificar natureza jurídica (OSC, clube, religioso, etc.).",
    observacao: "Publicado em 2026-05-22: 10.981 empenhos de natureza 3.3.50.* (Transferências a Instituições Privadas) 2020-2025. Arquivos: subvencoes_osc_sorocaba.csv (detalhe) e subvencoes_por_entidade_sorocaba.csv (1.187 entidades). Script: gerar_subvencoes_osc.py.",
    dimensao: "transferencias",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── Pessoal ────────────────────────────────────────────────────────────────
  {
    area: "Pessoal",
    dado: "Remuneração detalhada de servidores e cargos de confiança",
    status: "lacuna",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Inventariar publicação de remuneração individual — verificar formato (HTML/CSV/PDF) e campos publicáveis, incluindo secretários e DAS.",
    observacao: "Folha agregada já aparece no RGF. Publicação individual de servidores requer verificação jurídica de privacidade. Cargos de confiança e secretários têm tratamento diferente.",
    dimensao: "executivo",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Precatórios ────────────────────────────────────────────────────────────
  {
    area: "Precatórios",
    dado: "Dívidas judiciais da Prefeitura (precatórios e RPVs)",
    status: "lacuna",
    prioridade: "média",
    anos: "2020–2026",
    fonte: "TJ-SP + Portal de Transparência de Sorocaba",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Verificar se o portal municipal publica quadro de precatórios; consultar TJ-SP e CNJ para listagem de precatórios municipais.",
    observacao: "Precatórios podem representar passivo relevante não visível no orçamento corrente. CNJ mantém painel de precatórios municipais.",
    dimensao: "contratos",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Patrimônio imobiliário ─────────────────────────────────────────────────
  {
    area: "Patrimônio público",
    dado: "Inventário de imóveis públicos: uso, concessão e cessão",
    status: "lacuna",
    prioridade: "média",
    anos: "2020–2026",
    fonte: "Secretaria de Finanças / Departamento de Patrimônio",
    url: "https://fazenda.sorocaba.sp.gov.br/transparencia",
    proximo_passo: "Verificar se há publicação de bens imóveis no portal ou solicitar via LAI.",
    observacao: "Imóveis públicos cedidos, concessionados ou vendidos integram o patrimônio municipal. Fonte alternativa: IPTU isento (imóvel público).",
    dimensao: "executivo",
    anosPossiveis: 6,
    anosCobertos: 0,
  },
  // ── Controle externo ───────────────────────────────────────────────────────
  {
    area: "Controle externo",
    dado: "Pareceres e alertas do TCE-SP sobre Sorocaba",
    status: "parcial",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "TCE-SP — Comunicados SDG",
    url: "https://www.tce.sp.gov.br",
    proximo_passo: "Extrair texto integral dos PDFs dos comunicados SDG e expandir para anos anteriores via consulta processual legada.",
    observacao: "Publicado em 2026-05-22: 4 alertas do SDG bimestrais 2025 (SDG 41, 48, 57, 75/2025) referentes a descumprimento de incisos I e V da LRF. Arquivo: data/public/sorocaba/controle_externo/saida/alertas_sdg_2025_sorocaba.csv.",
    dimensao: "controle_externo",
    anosPossiveis: 6,
    anosCobertos: 1,
  },
  {
    area: "Controle externo",
    dado: "Auditoria externa e contas anuais (aprovação/rejeição pelo TCE-SP)",
    status: "parcial",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "TCE-SP / AUDESP",
    url: "https://www.tce.sp.gov.br",
    proximo_passo: "Expandir cobertura com resultado de julgamento por ano e vincular alertas específicos às áreas de gasto.",
    observacao: "Indicadores derivados do RREO/RGF já publicados como proxy de auditoria. Julgamento formal das contas pelo TCE-SP ainda não está estruturado como dataset.",
    dimensao: "controle_externo",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
  // ── SICONFI ────────────────────────────────────────────────────────────────
  {
    area: "SICONFI",
    dado: "DCA — Declaração das Contas Anuais (balanços PCASP)",
    status: "publicado",
    prioridade: "alta",
    anos: "2020–2025",
    fonte: "SICONFI / Tesouro Nacional — DCA",
    url: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca",
    proximo_passo: "Construir visualização de evolução patrimonial e alertar sobre Saldo Patrimonial negativo em 2024-2025.",
    observacao: "Publicado em 2026-05-22: 11.466 registros cobrindo 7 anexos (I-AB balanço patrimonial, I-C receitas, I-D/E despesas por função, I-F/G restos, I-HI variações patrimoniais) para 2020-2025. Ativo Total cresceu de R$5,5B (2020) para R$9,0B (2025); Saldo Patrimonial tornou-se negativo em 2024 (−R$1,2B) e 2025 (−R$2,4B). Arquivo: data/public/sorocaba/controle_externo/saida/dca_siconfi_sorocaba_2020_2025.csv.",
    dimensao: "controle_externo",
    anosPossiveis: 6,
    anosCobertos: 6,
  },
]
