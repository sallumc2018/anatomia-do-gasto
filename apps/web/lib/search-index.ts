export interface SearchEntry {
  title: string
  href: string
  description: string
  keywords: string[]
}

export const SEARCH_INDEX: SearchEntry[] = [
  {
    title: "Perguntas frequentes sobre o dinheiro público",
    href: "/#perguntas",
    description: "Comece por perguntas cidadãs: para onde foi o dinheiro, quanto entrou, quem recebeu e o que falta mapear",
    keywords: ["pergunta", "dúvida", "duvida", "não sei", "nao sei", "théo", "theo", "guia", "encontrar dado"],
  },
  {
    title: "Théo",
    href: "/#theo",
    description: "Guia de perguntas do site: transforma dúvidas vagas em caminhos auditáveis, fontes e lacunas",
    keywords: ["théo", "theo", "ia", "assistente", "chat", "perguntar", "explicar", "guia"],
  },
  {
    title: "Saúde em Sorocaba",
    href: "/saude",
    description: "Execução orçamentária 2020–2025, ASPS, SUS, mínimo constitucional de 15%",
    keywords: ["saúde", "saude", "hospital", "ubs", "sus", "asps", "atenção básica", "15%", "vigilância", "quanto gasta com saúde"],
  },
  {
    title: "Educação em Sorocaba",
    href: "/educacao",
    description: "Gasto em educação 2020–2025, FUNDEB, MDE, mínimo constitucional de 25%",
    keywords: ["educação", "educacao", "escola", "fundeb", "mde", "25%", "ensino fundamental", "educação infantil", "quanto gasta com educação"],
  },
  {
    title: "Segurança Pública",
    href: "/seguranca",
    description: "Gasto em segurança pública de Sorocaba, Guarda Municipal, Defesa Civil",
    keywords: ["segurança", "seguranca", "guarda municipal", "defesa civil", "policiamento", "inteligência"],
  },
  {
    title: "Transporte",
    href: "/transporte",
    description: "Gastos com transporte público e obras viárias em Sorocaba",
    keywords: ["transporte", "ônibus", "onibus", "obras viárias", "mobilidade", "função 26", "urbes", "obra", "contrato transporte"],
  },
  {
    title: "Câmara Municipal",
    href: "/camara-municipal",
    description: "25 vereadores, subsídios, LOA da Câmara 2020–2025",
    keywords: ["câmara", "camara", "vereador", "vereadores", "subsídio", "subsidio", "legislativo", "loa", "partido", "quanto ganha vereador", "emenda impositiva"],
  },
  {
    title: "Orçamento Municipal",
    href: "/executivo",
    description: "Orçamento total de Sorocaba por função 2020–2025, R$ 5,4 bilhões em 2025",
    keywords: ["orçamento", "orcamento", "executivo", "prefeitura", "função", "funcao", "gasto total", "bilhões", "rreo", "para onde vai o dinheiro"],
  },
  {
    title: "Saúde Fiscal",
    href: "/saude-fiscal",
    description: "Despesa com pessoal, dívida consolidada e RCL de Sorocaba 2020–2025. Comparação com limites da LRF e Resolução do Senado.",
    keywords: ["saúde fiscal", "lrf", "responsabilidade fiscal", "pessoal", "dívida", "rcl", "receita corrente líquida", "limite", "endividamento", "rgf", "passivo atuarial", "rpps"],
  },
  {
    title: "Receita Municipal",
    href: "/receita",
    description: "De onde vêm os recursos de Sorocaba: impostos, transferências da União e dos estados. Série 2020–2025.",
    keywords: ["receita", "arrecadação", "impostos", "iss", "iptu", "itbi", "transferências", "fpm", "icms", "ipva", "fundeb", "sus federal", "rreo", "anexo 01", "quanto entrou", "de onde vem o dinheiro"],
  },
  {
    title: "Pacto Federativo",
    href: "/pacto-federativo",
    description: "Como os recursos federais e estaduais chegam a Sorocaba",
    keywords: ["pacto federativo", "fpm", "icms", "transferências", "transferencias", "união", "estado", "município"],
  },
  {
    title: "Dados e downloads",
    href: "/dados",
    description: "Datasets públicos em CSV — saúde, educação, segurança, transporte",
    keywords: ["dados", "csv", "download", "dataset", "planilha", "open data", "arquivo"],
  },
  {
    title: "Metodologia",
    href: "/metodologia",
    description: "Como os dados são coletados, processados e publicados",
    keywords: ["metodologia", "fonte", "coleta", "pipeline", "siconfi", "rreo", "dca", "processo"],
  },
  {
    title: "Sobre o Projeto",
    href: "/sobre",
    description: "O que é o Anatomia do Gasto e por que foi criado",
    keywords: ["sobre", "projeto", "anatomia do gasto", "transparência", "transparencia", "cidadão", "missão"],
  },
  {
    title: "Política de Dados",
    href: "/politica-de-dados",
    description: "Regras de uso, atualização e correção dos dados publicados",
    keywords: ["política", "politica", "dados", "privacidade", "uso", "licença", "atualização"],
  },
  {
    title: "Política de Neutralidade",
    href: "/politica-de-neutralidade",
    description: "Como o site mantém imparcialidade na apresentação dos dados",
    keywords: ["neutralidade", "imparcialidade", "opinião", "editorial", "viés"],
  },
  {
    title: "Contato",
    href: "/contato",
    description: "Envie dúvidas, sugestões ou aponte erros nos dados",
    keywords: ["contato", "email", "dúvida", "sugestão", "erro", "reportar", "feedback"],
  },
  {
    title: "Auditoria dos dados",
    href: "/auditoria",
    description: "Verificação cruzada dos dados publicados e ranking de qualidade",
    keywords: ["auditoria", "verificação", "qualidade", "ranking", "conferência", "checagem"],
  },
]
