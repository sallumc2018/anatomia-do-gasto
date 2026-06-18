export type StatusPedido = "protocolado" | "pendente" | "respondido" | "recurso" | "publicado"
export type PrioridadePedido = "crítica" | "alta" | "média" | "baixa"

export interface PedidoLAI {
  id: number
  orgao: string
  descricao: string
  status: StatusPedido
  prioridade: PrioridadePedido
  data_protocolo?: string
  numero_esic?: string
  prazo_resposta?: string
  data_resposta?: string
  resultado?: string
}

export interface EntradaDiario {
  data: string
  titulo: string
  texto: string
  tipo: "protocolo" | "confirmacao" | "resposta" | "recurso" | "publicacao"
}

export const DIARIO_LAI: EntradaDiario[] = [
  {
    data: "24/05/2026",
    titulo: "Pedido protocolado",
    texto: "Primeiro pedido registrado no Fala.BR (plataforma federal de Acesso à Informação). Protocolo nº 03959.2026.000152-74. Prazo legal de resposta: 15/06/2026.",
    tipo: "protocolo",
  },
  {
    data: "24/05/2026",
    titulo: "Confirmação automática recebida",
    texto: "O sistema Fala.BR confirmou o registro do pedido por e-mail. O prazo de 20 dias começa a contar. Em caso de omissão após 30 dias, é possível apresentar reclamação. Após a resposta, há 10 dias para recurso (Lei 12.527/2011, art. 15).",
    tipo: "confirmacao",
  },
]

export const PEDIDOS_LAI: PedidoLAI[] = [
  // === CRÍTICOS (1–13) ===
  {
    id: 1,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Como cada real foi gasto — registro detalhado de todas as despesas (2020–2026)",
    status: "protocolado",
    prioridade: "crítica",
    data_protocolo: "24/05/2026",
    numero_esic: "03959.2026.000152-74",
    prazo_resposta: "15/06/2026",
  },
  {
    id: 2,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Quanto foi pago a cada fornecedor da Prefeitura (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 3,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Dívidas com fornecedores não pagas no exercício — restos a pagar (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 4,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Obras públicas municipais: contratos, valores e execução (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 5,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Contratos firmados pela Prefeitura e seus aditamentos (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 6,
    orgao: "Câmara Municipal de Sorocaba",
    descricao: "Gastos de gabinete e contratos da Câmara Municipal (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 7,
    orgao: "Urbes de Sorocaba",
    descricao: "Despesas mensais da Urbes com transporte público (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 8,
    orgao: "Urbes de Sorocaba",
    descricao: "Quanto a Prefeitura paga à operadora de ônibus (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 9,
    orgao: "Urbes de Sorocaba",
    descricao: "Contrato de concessão do transporte coletivo (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 10,
    orgao: "SAAE de Sorocaba",
    descricao: "Receitas e despesas do serviço de água e esgoto — SAAE (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 11,
    orgao: "SAAE de Sorocaba",
    descricao: "Licitações e contratos de obras do SAAE (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 12,
    orgao: "FUNSERV de Sorocaba",
    descricao: "Balanços financeiros do fundo de previdência dos servidores — FUNSERV (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 13,
    orgao: "FUNSERV de Sorocaba",
    descricao: "Avaliação atuarial do FUNSERV: o rombo previdenciário em números (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  // === ALTA (14–27) ===
  {
    id: 14,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Plano Plurianual — o que a Prefeitura prometeu fazer (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 15,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Lei de Diretrizes Orçamentárias — metas e prioridades anuais (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 16,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Lei Orçamentária Anual — o orçamento aprovado a cada ano (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 17,
    orgao: "Prefeitura de Sorocaba",
    descricao: "De onde veio cada real arrecadado — receitas analíticas (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 18,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Balancetes mensais de arrecadação (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 19,
    orgao: "Prefeitura de Sorocaba",
    descricao: "RREO — execução orçamentária bimestral completa (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 20,
    orgao: "Prefeitura de Sorocaba",
    descricao: "RGF — gestão fiscal e limites da Lei de Responsabilidade Fiscal (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 21,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Aplicação de recursos em saúde — relatórios da LRF (2020–2026)",
    status: "publicado",
    prioridade: "alta",
  },
  {
    id: 22,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Aplicação de recursos em educação — relatórios da LRF (2020–2026)",
    status: "publicado",
    prioridade: "alta",
  },
  {
    id: 23,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Processos licitatórios da Prefeitura (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 24,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Diário Oficial — publicações oficiais do município (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 25,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Remuneração dos servidores municipais (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 26,
    orgao: "Câmara Municipal de Sorocaba",
    descricao: "Subsídios e remuneração dos vereadores (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 27,
    orgao: "Câmara Municipal de Sorocaba",
    descricao: "Projetos de lei e votos dos vereadores (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  // === MÉDIA (28–34) ===
  {
    id: 28,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Receitas extraorçamentárias — cauções, depósitos e retenções (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 29,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Despesas extraorçamentárias analíticas (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 30,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Movimentação das contas bancárias municipais (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 31,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Livro Caixa da contabilidade municipal (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 32,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Livro Diário da contabilidade municipal (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 33,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Livro Razão da contabilidade municipal (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  {
    id: 34,
    orgao: "Prefeitura de Sorocaba",
    descricao: "Precatórios — dívidas judiciais da Prefeitura (2020–2026)",
    status: "pendente",
    prioridade: "média",
  },
  // === BAIXA (35) ===
  {
    id: 35,
    orgao: "AGEM de Sorocaba",
    descricao: "Receitas e despesas da agência metropolitana — AGEM (2020–2026)",
    status: "pendente",
    prioridade: "baixa",
  },
  // === FEDERAL (36–40) — dados de portais federais ===
  {
    id: 36,
    orgao: "Tesouro Nacional (SICONFI)",
    descricao: "Matriz de saldos contábeis mensal — livro razão digital enviado ao Tesouro Nacional (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 37,
    orgao: "FNDE (SIOPE)",
    descricao: "Receitas e despesas em educação — dados do SIOPE para validação independente (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 38,
    orgao: "FNDE",
    descricao: "Repasses federais em educação — PNAE, PDDE, PNATE e FUNDEB enviados a Sorocaba (2020–2026)",
    status: "pendente",
    prioridade: "alta",
  },
  {
    id: 39,
    orgao: "Controladoria-Geral da União (CGU)",
    descricao: "Transferências federais recebidas por Sorocaba — constitucionais, legais e voluntárias (2020–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
  {
    id: 40,
    orgao: "Governo Federal (PNCP)",
    descricao: "Licitações, contratos e atas registrados no Portal Nacional de Contratações Públicas (2022–2026)",
    status: "pendente",
    prioridade: "crítica",
  },
]

export const TOTAL_PEDIDOS = PEDIDOS_LAI.length
export const PROTOCOLADOS = PEDIDOS_LAI.filter((p) => p.status === "protocolado" || p.status === "respondido" || p.status === "recurso").length
export const RESPONDIDOS = PEDIDOS_LAI.filter((p) => p.status === "respondido" || p.status === "publicado").length
