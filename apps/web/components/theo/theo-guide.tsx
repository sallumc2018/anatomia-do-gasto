"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"

type TheoLink = {
  href: string
  label: string
}

type TheoRoute = {
  id: string
  title: string
  answer: string
  answerSimple?: string
  status: "Disponível" | "Lacuna" | "Em coleta"
  confidence: "Alta" | "Média"
  keywords: string[]
  links: TheoLink[]
  source: string
  limitation: string
}

type FormalityLevel = "padrao" | "simples"

function detectFormality(query: string): FormalityLevel {
  const q = query.toLowerCase()
  let signals = 0

  // Abreviações comuns
  if (/\b(vc|pq|tb|msm|blz|vlw|obg|mto|nao\b|num\b|eh\b)\b/.test(q)) signals += 2
  // Gírias e interjeições
  if (/\b(cara|tipo|mano|vei|vei|po\b|puts|nossa|eai|e ai|opa)\b/.test(q)) signals += 2
  // Riso
  if (/k{3,}|haha|rsrs/.test(q)) signals += 2
  // Múltipla pontuação expressiva
  if (/[?!]{2,}/.test(query)) signals += 1
  // Frase muito curta (≤ 4 palavras) — sinal fraco, só complementa
  if (q.trim().split(/\s+/).length <= 4) signals += 1

  return signals >= 2 ? "simples" : "padrao"
}

const THEO_ROUTES: TheoRoute[] = [
  {
    id: "receita",
    title: "Quanto entrou em Sorocaba?",
    answer:
      "Aqui você encontra de onde vem o dinheiro de Sorocaba. A página de receita separa o que a cidade arrecada diretamente — como IPTU, ISS e ITBI — do que recebe da União (FPM, SUS federal, FUNDEB) e do Estado (ICMS, IPVA), ano a ano.",
    answerSimple:
      "Sorocaba recebe dinheiro de três fontes principais: o que arrecada diretamente dos moradores (como IPTU e ISS), o que vem do governo federal (como o Fundo de Participação dos Municípios e repasses do SUS) e o que vem do Estado (como a cota do ICMS e do IPVA). A página de receita mostra tudo isso separado, ano a ano.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "receita", "arrecadou", "arrecadacao", "arrecadacao propria", "entrou", "imposto", "iss", "iptu", "iptu 2024",
      "itbi", "icms", "fpm", "fundeb", "transferencia", "transferencias", "quanto entrou", "recursos proprios",
      "de onde vem o dinheiro", "de onde vem o recurso", "fonte de recurso", "receita propria",
      "quanto sorocaba arrecada", "arrecadamento", "receita corrente", "quanto a prefeitura recebe",
    ],
    links: [
      { href: "/sorocaba/receita", label: "Abrir receita" },
      { href: "/sorocaba/pacto-federativo", label: "Pacto federativo" },
      { href: "/sorocaba/dados", label: "Baixar dados" },
    ],
    source: "Dados publicados em data/public/sorocaba/receita.",
    limitation: "Valores agregados; não detalha cada guia, contribuinte ou conta bancária.",
  },
  {
    id: "pacto-federativo",
    title: "Como vem o dinheiro federal e estadual?",
    answer:
      "Boa parte da receita de Sorocaba não vem de impostos locais, mas de repasses. A página de pacto federativo explica cada um: o FPM varia com a população, o ICMS e o IPVA são cotas estaduais, e o FUNDEB e o SUS federal chegam com destino obrigatório a educação e saúde. É o ponto de partida para entender de onde vem cada real.",
    answerSimple:
      "Grande parte do dinheiro que Sorocaba tem não vem dos impostos cobrados aqui — vem de repasses do governo federal e estadual. O Fundo de Participação dos Municípios depende do tamanho da população; o ICMS e o IPVA são cotas do Estado; o Fundo de Manutenção da Educação Básica e os recursos do SUS chegam com destino obrigatório. Essa página explica de onde vem cada real.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "fpm", "cota fpm", "icms", "ipva", "fundeb repasse", "repasse federal", "repasse estadual",
      "transferencia federal", "transferencia estadual", "transferencias constitucionais",
      "pacto federativo", "complementacao", "cota parte", "sus federal", "fnde", "siope",
      "como vem o dinheiro federal", "de onde vem recurso federal", "uniao repassa",
      "estado repassa", "governo federal repasse", "quanto repassa a uniao",
    ],
    links: [
      { href: "/sorocaba/pacto-federativo", label: "Abrir pacto federativo" },
      { href: "/sorocaba/receita", label: "Ver receita total" },
    ],
    source: "Dados publicados em data/public/sorocaba/receita com classificação por origem.",
    limitation: "Transferências voluntárias (convênios, emendas Pix) não estão detalhadas nessa página.",
  },
  {
    id: "executivo",
    title: "Para onde foi o dinheiro?",
    answer:
      "Quer saber para onde vai o orçamento da Prefeitura? Comece pela página de orçamento por função — ela mostra o total destinado a saúde, educação, segurança, transporte e administração. De lá, você pode entrar em cada área para ver mais detalhes.",
    answerSimple:
      "Essa página mostra para onde vai o orçamento da Prefeitura dividido por área: saúde, educação, segurança, transporte, administração. É o ponto de partida para entender como o dinheiro é distribuído — e de cada área você pode aprofundar os detalhes.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "para onde", "gasto", "orcamento", "funcao", "despesa", "area", "dinheiro", "gastou", "executivo",
      "prefeitura gasta", "quanto a prefeitura gasta", "destino do dinheiro", "como gasta",
      "gasto publico", "bilhoes", "total de gastos", "gasto total", "orçamento municipal",
      "onde vai o dinheiro", "para onde vai", "despesa total", "quanto custa a prefeitura",
    ],
    links: [
      { href: "/sorocaba/executivo", label: "Abrir orçamento" },
      { href: "/sorocaba/saude", label: "Saúde" },
      { href: "/sorocaba/educacao", label: "Educação" },
    ],
    source: "Dados publicados em data/public/sorocaba/executivo e páginas setoriais.",
    limitation: "Mostra função/subfunção quando a fonte permite; não identifica fornecedor por essa trilha.",
  },
  {
    id: "execucao",
    title: "O dinheiro foi autorizado ou pago?",
    answer:
      "A página de execução mostra o ciclo completo do gasto: dotação é o que a lei autoriza; empenho é a reserva do valor; liquidação confirma que o serviço foi entregue; pagamento é a transferência efetiva. Também aparecem os restos a pagar — empenhos de anos anteriores que ainda não foram quitados.",
    answerSimple:
      "O dinheiro público passa por quatro etapas antes de sair do caixa da Prefeitura: a dotação é o valor que a lei autoriza gastar; o empenho reserva esse valor para um fim específico; a liquidação confirma que o serviço ou produto foi entregue; e o pagamento é a transferência efetiva. A página também mostra os restos a pagar, que são compromissos de anos anteriores ainda não quitados.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "pago", "pagou", "liquidado", "liquidacao", "empenho", "empenhado", "dotacao", "autorizado",
      "execucao", "execucao orcamentaria", "restos a pagar", "foi executado", "o dinheiro saiu",
      "fase da despesa", "nota de empenho", "empenho liquidado", "pagamento realizado",
      "diferenca dotacao empenho", "o que foi pago", "quanto foi pago", "pagamento efetivo",
    ],
    links: [
      { href: "/sorocaba/execucao", label: "Abrir execução" },
      { href: "/metodologia", label: "Ver metodologia" },
    ],
    source: "Dados publicados em data/public/sorocaba/executivo e trilhas de execução já publicadas.",
    limitation: "Nem todo nível de detalhe de empenho/fornecedor está publicado.",
  },
  {
    id: "glossario",
    title: "O que significa empenho, liquidação, pagamento?",
    answer:
      "Dotação é o valor que a lei autoriza gastar. Empenho reserva esse valor para um fim específico. Liquidação confirma que o serviço ou produto foi entregue. Pagamento é a transferência do dinheiro. Restos a pagar são empenhos de um ano que ficam pendentes para o seguinte.",
    answerSimple:
      "Dotação é o limite que a lei autoriza gastar. Empenho é a reserva desse valor para um destino específico — como uma compra ou contrato. Liquidação confirma que o serviço foi prestado ou o produto foi entregue. Pagamento é a transferência do dinheiro. Restos a pagar são empenhos feitos em um ano que ficam pendentes para o seguinte.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "empenho", "o que e empenho", "liquidacao", "o que e liquidacao", "pagamento efetivo",
      "restos a pagar", "dotacao", "o que significa", "glossario", "termos", "explicar",
      "nomenclatura", "diferenca entre empenho", "fase orcamentaria", "o que quer dizer",
      "como funciona o orcamento", "etapas do gasto", "termos tecnicos", "linguagem tecnica",
      "nao entendo o termo", "vocabulario orcamentario", "execucao orcamentaria fases",
    ],
    links: [
      { href: "/sorocaba/execucao", label: "Abrir execução orçamentária" },
      { href: "/metodologia", label: "Ver metodologia" },
    ],
    source: "Glossário público do projeto e metodologia publicada.",
    limitation: "Explica os termos usados neste site; não substitui consulta a legislação específica.",
  },
  {
    id: "servicos",
    title: "Quanto custam os serviços públicos?",
    answer:
      "As páginas de saúde, educação, segurança e transporte mostram a série histórica de 2020 a 2025, com fonte e limitações declaradas. Quando há mínimo constitucional obrigatório, o percentual também aparece. É o nível mais detalhado disponível hoje no site.",
    answerSimple:
      "As páginas de saúde, educação, segurança e transporte reúnem dados de 2020 a 2025, com a fonte e as limitações declaradas em cada uma. Quando existe um mínimo obrigatório por lei, o percentual aplicado também aparece. É o nível mais detalhado disponível no site hoje.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "saude", "educacao", "seguranca", "transporte", "servico", "servicos", "hospital", "escola",
      "guarda", "onibus", "mobilidade", "quanto gasta com saude", "quanto gasta com educacao",
      "quanto gasta com seguranca", "quanto gasta com transporte", "ubs", "unidade basica de saude",
      "ensino fundamental", "educacao infantil", "guarda municipal", "defesa civil",
      "medico", "medicos", "professor", "professores", "gasto com educacao", "gasto com saude",
    ],
    links: [
      { href: "/sorocaba/saude", label: "Saúde" },
      { href: "/sorocaba/educacao", label: "Educação" },
      { href: "/sorocaba/seguranca", label: "Segurança" },
      { href: "/sorocaba/transporte", label: "Transporte" },
    ],
    source: "Dados setoriais publicados em data/public/sorocaba.",
    limitation: "Os painéis não chegam a unidade, escola, UBS, contrato ou nota fiscal individual.",
  },
  {
    id: "minimo-constitucional",
    title: "Sorocaba cumpre os mínimos de saúde e educação?",
    answer:
      "A Constituição exige que o município aplique ao menos 15% da receita em saúde e 25% em educação. As páginas de saúde e educação mostram esses percentuais ano a ano. Quando o mínimo não foi cumprido, a limitação é declarada diretamente na página.",
    answerSimple:
      "A Constituição obriga os municípios a aplicar pelo menos 15% da receita em saúde e 25% em educação. As páginas dessas duas áreas mostram, ano a ano, se Sorocaba cumpriu esses percentuais. Quando o mínimo não foi atingido, a limitação é declarada diretamente na página.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "minimo constitucional", "15 por cento", "25 por cento", "limite saude", "limite educacao",
      "cumpre minimo", "cumpre o minimo", "asps", "mde", "nao cumpriu", "mde exigido", "asps exigida",
      "constitucional saude", "constitucional educacao", "percentual saude", "percentual educacao",
      "quanto tem que gastar com saude", "quanto tem que gastar com educacao", "obrigacao legal",
      "vinculacao constitucional", "gasto minimo obrigatorio",
      "minimo saude", "minimo educacao", "15 por cento saude", "25 por cento educacao",
      "cumpriu o minimo", "o que e asps", "o que e mde",
    ],
    links: [
      { href: "/sorocaba/saude", label: "Mínimo em saúde" },
      { href: "/sorocaba/educacao", label: "Mínimo em educação" },
      { href: "/metodologia", label: "Como é calculado" },
    ],
    source: "Dados publicados em data/public/sorocaba/saude e educacao.",
    limitation: "Mínimo calculado a partir dos dados publicados; pequenas diferenças metodológicas podem existir.",
  },
  {
    id: "fornecedores",
    title: "Quem recebeu dinheiro público?",
    answer:
      "A página de fornecedores mostra quem recebeu dinheiro público de Sorocaba. Cada linha representa um destinatário registrado na conta-corrente — empresas, entidades, folha de pessoal e fundos. Série completa disponível para todos os anos de 2020 a 2025, com ranking dos 50 maiores recebedores.",
    answerSimple:
      "A página de fornecedores mostra quem recebeu dinheiro da Prefeitura de Sorocaba: empresas, entidades sem fins lucrativos, folha de pessoal e fundos. Série completa 2020–2025 com ranking dos maiores recebedores.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "quem recebeu", "fornecedor", "fornecedores", "cnpj", "empresa", "contrato", "pagamento",
      "recebedor", "quem ganhou", "quem foi pago", "empresa contratada", "maior recebedor",
      "ranking fornecedor", "busca por empresa", "busca por cnpj", "pesquisar fornecedor",
      "qual empresa recebeu", "quanto recebeu empresa", "top fornecedores",
    ],
    links: [
      { href: "/sorocaba/fornecedores", label: "Ver fornecedores" },
      { href: "/sorocaba/dados", label: "Baixar dados" },
    ],
    source: "Dados publicados em data/public/sorocaba/fornecedores · Portal de Transparência de Sorocaba · PDFs Livro Conta-Corrente Fornecedor 2022 e 2023.",
    limitation: "Não identifica o objeto do gasto — apenas o destinatário. Classificação automática por nome pode ter imprecisões.",
  },
  {
    id: "contratos",
    title: "Quais contratos existem?",
    answer:
      "Contratos e licitações são uma lacuna declarada no site. As fontes existem e estão identificadas: o Portal Nacional de Contratações Públicas (PNCP, obrigatório desde 2022 pela Lei 14.133) e o portal de transparência da Prefeitura para contratos anteriores. A curadoria e publicação ainda não foram feitas.",
    answerSimple:
      "Contratos e licitações ainda não foram publicados no site — é uma lacuna declarada. As fontes estão identificadas: o PNCP (para contratos a partir de 2022) e o portal da Prefeitura (para anos anteriores). O plano é cruzar cada contrato com empenhos e pagamentos.",
    status: "Lacuna",
    confidence: "Média",
    keywords: [
      "contrato", "contratos", "licitacao", "licitacoes", "pncp", "pregao", "obra contratada",
      "fornecedor contratado", "empresa contratada", "valor contrato", "vigencia contrato",
      "objeto contrato", "aditivo", "dispensa de licitacao", "modalidade licitacao",
      "inexigibilidade", "contrato emergencial", "licitacao vencedor",
    ],
    links: [
      { href: "/sorocaba/lacunas", label: "Ver lacunas documentadas" },
      { href: "/sorocaba/fornecedores", label: "Quem recebeu (agregado)" },
    ],
    source: "Fontes identificadas: pncp.gov.br (2022+) e fazenda.sorocaba.sp.gov.br/transparencia (2020-2021).",
    limitation: "Sem página de contratos publicada. Coleta e curadoria pendentes.",
  },
  {
    id: "obras",
    title: "Quais obras existem?",
    answer:
      "Obras públicas são uma lacuna declarada. As fontes estão identificadas: o PNCP reúne contratos de obras licitadas a partir de 2022 e o TCE-SP publica alertas e fiscalizações. Obras anteriores a 2022 estão no portal de transparência da Prefeitura. A página de transporte já traz dados da função 26 (mobilidade).",
    answerSimple:
      "Obras públicas ainda são uma lacuna declarada no site. As fontes estão identificadas: o PNCP reúne contratos de obras licitadas a partir de 2022, e o TCE-SP publica alertas e fiscalizações. A página de transporte já traz alguns dados de mobilidade.",
    status: "Lacuna",
    confidence: "Média",
    keywords: [
      "obra", "obras", "construcao", "reforma", "pavimentacao", "obra publica", "quanto custou obra",
      "obra atrasada", "obras viarias", "obra em andamento", "obra concluida", "obra parada",
      "infraestrutura", "obra de mobilidade", "obra da prefeitura", "obra do municipio",
      "custo obra", "obra licitada", "projeto de obra",
    ],
    links: [
      { href: "/sorocaba/lacunas", label: "Ver lacunas documentadas" },
      { href: "/sorocaba/transporte", label: "Transporte e infraestrutura" },
    ],
    source: "Fontes: pncp.gov.br (obras 2022+), tce.sp.gov.br (fiscalizações), fazenda.sorocaba.sp.gov.br/transparencia (obras anteriores).",
    limitation: "Sem página de obras publicada. Coleta e curadoria pendentes.",
  },
  {
    id: "autarquias",
    title: "E as autarquias? (SAAE, Urbes, FUNSERV)",
    answer:
      "SAAE, Urbes e FUNSERV ainda não têm dados separados publicados — são lacunas declaradas. As fontes estão identificadas: Urbes em urbes.com.br/transparencia/index, SAAE em saaesorocaba.com.br/transparencia e FUNSERV em funservsorocaba.sp.gov.br/transparencia. O passivo atuarial do FUNSERV já aparece no RGF publicado em saúde fiscal.",
    answerSimple:
      "O SAAE (água e esgoto), a Urbes (transporte) e o FUNSERV (previdência) ainda não têm dados publicados no site — são lacunas declaradas. As fontes estão identificadas: cada órgão tem portal de transparência próprio. O passivo atuarial do FUNSERV já aparece na página de saúde fiscal.",
    status: "Em coleta",
    confidence: "Média",
    keywords: [
      "saae", "urbes", "funserv", "agem", "autarquia", "empresa publica", "transporte publico",
      "onibus sorocaba", "agua sorocaba", "saneamento", "previdencia municipal", "funserv investimento",
      "onibus concessao", "concessao transporte", "tarifas onibus", "deficit transporte",
      "fundo previdenciario", "passivo atuarial funserv",
    ],
    links: [
      { href: "/sorocaba/saude-fiscal", label: "Saúde fiscal (passivo FUNSERV)" },
      { href: "/sorocaba/lacunas", label: "Ver lacunas documentadas" },
    ],
    source: "Fontes: urbes.com.br/transparencia/index · saaesorocaba.com.br/transparencia · funservsorocaba.sp.gov.br/transparencia.",
    limitation: "Dados de autarquias não estão publicados no site. Coleta e curadoria pendentes.",
  },
  {
    id: "camara",
    title: "Quanto custa a Câmara?",
    answer:
      "A página da Câmara reúne os subsídios dos 25 vereadores, a LOA da Câmara de 2020 a 2025 e os agentes públicos mapeados. Despesas de gabinete, emendas impositivas e contratos detalhados ainda dependem de curadoria adicional e são lacunas declaradas.",
    answerSimple:
      "A página da Câmara reúne os subsídios dos 25 vereadores, a Lei Orçamentária Anual da Câmara de 2020 a 2025 e os agentes públicos mapeados. Despesas de gabinete, emendas e contratos detalhados ainda dependem de curadoria adicional e são lacunas declaradas.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "camara", "vereador", "vereadores", "subsidio", "legislativo", "gabinete", "emenda",
      "quanto ganha vereador", "salario vereador", "remuneracao vereador", "custo vereador",
      "quanto custa a camara", "orcamento da camara", "loa camara", "gasto da camara",
      "o que faz o vereador", "meu vereador", "mandato vereador", "partido vereador",
    ],
    links: [
      { href: "/sorocaba/camara-municipal", label: "Abrir Câmara" },
      { href: "/sorocaba/auditoria", label: "Ver agentes" },
    ],
    source: "Dados publicados sobre poder público de Sorocaba.",
    limitation: "Despesas de gabinete, emendas impositivas e contratos detalhados ainda não publicados.",
  },
  {
    id: "emendas",
    title: "Emendas de vereadores",
    answer:
      "As emendas impositivas dos vereadores são uma lacuna declarada. A fonte está identificada no CEPA, com link público divulgado pela Prefeitura que redireciona para servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas. Ainda não há dados publicados sobre execução e pagamento de emendas.",
    answerSimple:
      "Ainda não há dados publicados sobre as emendas dos vereadores. A fonte está identificada: CEPA, divulgado publicamente pela Prefeitura e disponível em servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas, com dados de emendas por autor, destino e valor. A coleta e publicação ainda estão pendentes.",
    status: "Em coleta",
    confidence: "Média",
    keywords: [
      "emenda", "emendas", "emenda impositiva", "emenda parlamentar", "vereador emenda",
      "emenda pix", "emenda de bancada", "emenda individual", "indicou", "emenda indicada",
      "recurso emenda", "cota emenda", "entidade beneficiada", "convênio emenda",
      "quanto cada vereador destinou", "emenda foi executada", "emenda foi paga",
    ],
    links: [
      { href: "/sorocaba/camara-municipal", label: "Câmara Municipal" },
      { href: "/sorocaba/lacunas", label: "Ver lacunas documentadas" },
    ],
    source: "Fonte identificada: servicos.sorocaba.sp.gov.br/cepa_publico/#/emendas · camarasorocaba.sp.gov.br (transparência).",
    limitation: "Sem dados de emendas publicados. Coleta no portal CEPA pendente.",
  },
  {
    id: "fiscal",
    title: "Sorocaba está endividada?",
    answer:
      "A página de saúde fiscal mostra os principais indicadores de equilíbrio das contas: dívida consolidada, despesa com pessoal, Receita Corrente Líquida (RCL), passivo atuarial do FUNSERV e os limites da Lei de Responsabilidade Fiscal. Você pode comparar esses números com os tetos constitucionais ano a ano.",
    answerSimple:
      "Essa página reúne os principais indicadores do equilíbrio financeiro de Sorocaba: dívida consolidada, despesa com pessoal, Receita Corrente Líquida, passivo atuarial do FUNSERV e os limites definidos pela Lei de Responsabilidade Fiscal. É possível comparar cada número com os tetos legais, ano a ano.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "divida", "endividada", "endividamento", "fiscal", "rcl", "pessoal", "rpps", "previdencia",
      "lrf", "responsabilidade fiscal", "limite de gasto com pessoal", "divida publica",
      "equilibrio fiscal", "deficit", "superavit", "gasto com funcionalismo", "folha de pagamento",
      "passivo atuarial", "rgf", "rreo fiscal", "sorocaba deve", "sorocaba quebrada",
      "quanto deve sorocaba", "divida consolidada",
      "salario do prefeito", "salario servidor", "quanto ganha servidor", "quanto ganham os servidores",
      "gasto com servidores", "remuneracao servidor", "salario funcionalismo",
    ],
    links: [
      { href: "/sorocaba/saude-fiscal", label: "Abrir saúde fiscal" },
      { href: "/sorocaba/dados", label: "Baixar CSVs" },
    ],
    source: "Dados publicados em data/public/sorocaba/fiscal.",
    limitation: "Indicadores fiscais não substituem parecer técnico do TCE-SP ou balanço completo.",
  },
  {
    id: "auditoria-dados",
    title: "Como os dados são verificados?",
    answer:
      "A página de auditoria mostra verificações cruzadas dos dados publicados e um ranking de qualidade por área. O site declara explicitamente cada lacuna e limitação encontrada. Não fazemos auditoria jurídica — a interpretação dos números cabe a você e aos órgãos de controle, como o TCE-SP.",
    answerSimple:
      "A página de auditoria mostra verificações cruzadas dos dados publicados e um ranking de qualidade por área. O site declara explicitamente cada lacuna e limitação encontrada. Não é uma auditoria jurídica — a interpretação dos números cabe a você e aos órgãos de controle, como o TCE-SP.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "verificacao", "auditoria", "conferencia", "tce", "tce-sp", "tribunal de contas",
      "qualidade", "ranking qualidade", "checagem", "cruzamento", "validar dado", "dado confiavel",
      "irregularidade", "o site e confiavel", "posso confiar nos dados", "como verificar",
      "quem audita", "quem confere", "dado errado", "erro no dado", "como conferir",
      "corrupcao", "denuncia", "suspeita", "informacao errada", "reportar erro",
      "ouvidoria", "irregularidade fiscal",
    ],
    links: [
      { href: "/sorocaba/auditoria", label: "Abrir auditoria" },
      { href: "/metodologia", label: "Ver metodologia" },
    ],
    source: "Verificação cruzada de dados publicados em data/public.",
    limitation: "Auditoria de qualidade, não jurídica. Discrepâncias devem ser reportadas pelo formulário de contato.",
  },
  {
    id: "sobre",
    title: "O que é o Anatomia do Gasto?",
    answer:
      "O site é gratuito, independente e apartidário — criado por um cidadão para organizar dados públicos em linguagem acessível. Não tem vínculo com partidos, governos ou empresas. Começou em Sorocaba com a meta de expandir para outros municípios.",
    answerSimple:
      "O site é gratuito, independente e sem vínculo com partidos, governos ou empresas — foi criado por um cidadão para organizar dados públicos em linguagem acessível. Começou em Sorocaba com o objetivo de expandir para outros municípios.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "o que e", "anatomia do gasto", "projeto", "quem fez", "quem criou", "independente",
      "apartidario", "governo", "partido", "objetivo", "missao", "sobre", "quem mantem",
      "quem e o responsavel", "e oficial", "e governamental", "e uma ong",
      "como surgiu", "por que criou", "finalidade", "proposito do site",
      "e do prefeito", "e da prefeitura", "quem e o dono", "quem financia",
    ],
    links: [
      { href: "/sobre", label: "Sobre o projeto" },
      { href: "/metodologia", label: "Como funciona" },
      { href: "/contato", label: "Contato" },
    ],
    source: "Documentação pública do projeto.",
    limitation: "Site em maturação; novas cidades e funcionalidades estão no roadmap.",
  },
  {
    id: "fontes",
    title: "Quais fontes sustentam a resposta?",
    answer:
      "Os dados vêm de portais oficiais como SICONFI, RREO, DCA e portais municipais. Cada página informa a fonte, o período coberto, o escopo e as limitações. Para baixar os dados brutos, use a página de dados; para entender o processo, consulte a metodologia.",
    answerSimple:
      "Os dados vêm de portais oficiais do governo federal e municipal. Cada página informa de onde veio o dado, qual período cobre e quais são as limitações. Para baixar os dados brutos, use a página de dados; para entender como tudo funciona, consulte a metodologia.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "fonte", "fontes", "metodologia", "validacao", "auditar", "baixar", "csv", "dados",
      "download", "confianca", "siconfi", "rreo", "dca", "portal transparencia",
      "de onde veio", "de onde saiu", "qual a fonte", "fonte oficial", "dados abertos",
      "planilha", "dataset", "open data", "usar os dados", "como usar",
      "api", "acesso programatico", "baixar dados", "tem api", "endpoint",
    ],
    links: [
      { href: "/metodologia", label: "Abrir metodologia" },
      { href: "/sorocaba/dados", label: "Abrir datasets" },
      { href: "/sorocaba/auditoria", label: "Abrir auditoria" },
    ],
    source: "Metodologia pública e datasets em data/public.",
    limitation: "Se uma fonte não estiver publicada ou documentada, a resposta deve declarar lacuna.",
  },
  {
    id: "missao-ong",
    title: "Qual é o propósito e a missão da ONG?",
    answer:
      "O Anatomia do Gasto é um projeto cívico independente e apartidário que tem como missão transformar o 'bosque de números' dos portais de transparência públicos em caminhos nítidos que qualquer cidadão comum consiga compreender, sem precisar ser especialista em contabilidade pública. Focamos em expor de forma clara como o dinheiro entra nos cofres municipais e para onde ele vai, começando por Saúde e Educação em Sorocaba/SP e expandindo para todo o Brasil.",
    answerSimple:
      "A nossa missão é explicar de forma simples, para qualquer pessoa, como o dinheiro dos impostos entra e sai da prefeitura. Queremos transformar números complicados de contabilidade pública em informações fáceis de entender, começando por Saúde e Educação em Sorocaba/SP, de forma independente de governos ou partidos políticos.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "ong", "missao", "proposito", "objetivo", "finalidade", "por que criar", "meta", "visao", "valores", "ideal",
      "apartidario", "independente", "quem mantem", "proposito da ong", "quem financia", "quem e o dono",
    ],
    links: [
      { href: "/sobre", label: "Sobre o projeto" },
      { href: "/institucional", label: "Estrutura institucional" },
      { href: "/voluntarios", label: "Como contribuir" },
    ],
    source: "Diretrizes estratégicas publicadas em docs/estrategia.md.",
    limitation: "O projeto é mantido de forma cívica e independente, sem fins lucrativos.",
  },
  {
    id: "tecnologia-site",
    title: "Como este site foi desenvolvido e qual é a stack tecnológica?",
    answer:
      "O ecossistema técnico do Anatomia do Gasto é dividido em duas frentes: o portal web frontend é construído em Next.js (com TypeScript, React, Tailwind CSS e gráficos interativos em Recharts) para garantir alta performance, acessibilidade e excelente SEO. O pipeline de engenharia de dados, ingestão, limpeza e validação de fontes brutas é desenvolvido em Python (utilizando pandas, pdfplumber para extração de PDFs municipais e scripts customizados de qualidade).",
    answerSimple:
      "Este site é feito com Next.js (um framework de React) com TypeScript e Tailwind CSS para a parte visual e os gráficos. Para coletar e organizar as contas públicas dos arquivos da prefeitura, usamos scripts de Python com bibliotecas de manipulação de dados como o pandas.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "tecnologia", "stack", "linguagem", "framework", "como foi construido", "desenvolvimento", "next.js", "react",
      "typescript", "tailwind", "python", "pdfplumber", "pandas", "recharts", "como o site funciona", "codigo fonte",
    ],
    links: [
      { href: "https://github.com/sallumc2018/anatomia-do-gasto", label: "GitHub do projeto" },
      { href: "/metodologia", label: "Metodologia de dados" },
    ],
    source: "Arquitetura técnica documentada em docs/arquitetura.md.",
    limitation: "O repositório do portal é público, porém dados não auditados e credenciais são restritos.",
  },
  {
    id: "estrutura-workspace",
    title: "Como funciona a organização de arquivos e o workspace Omega?",
    answer:
      "O ambiente local de desenvolvimento (chamado de Omega) é dividido em três camadas semânticas para manter o SSD leve e seguro: 1. Pessoal (área reservada a diários e estudos privados); 2. Profissional (repositórios git como 'anatomia-do-gasto', dados da ONG e escrita pública); 3. Sistema (infraestrutura, utilitários locais e governança). O projeto utiliza links de junção física (Directory Junctions) para integrar o SSD local veloz à nuvem de arquivamento pesado de 5 TB, permitindo acessar gigabytes de PDFs contábeis com latência zero e sem sobrecarregar o disco local.",
    answerSimple:
      "Nosso workspace de trabalho local chama-se Omega e é dividido em três áreas organizadas: Pessoal, Profissional (onde programamos o site e guardamos as análises da ONG) e Sistema. Usamos atalhos especiais de junção de pastas para conectar o nosso disco local de alta velocidade com um arquivo pesado de 5 TB na nuvem, onde ficam os PDFs de auditoria.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "workspace", "pastas", "arquivos", "diretorios", "organizacao", "omega", "pessoal", "profissional", "sistema",
      "ssd", "drive g", "nuvem", "junctions", "directory junctions", "sincronizacao", "estrutura de pastas",
    ],
    links: [
      { href: "https://github.com/sallumc2018/anatomia-do-gasto", label: "Ver repositório" },
      { href: "/sorocaba/dados", label: "Datasets publicados" },
    ],
    source: "Manual de organização de workspace em MAPA_OPERACIONAL_OMEGA.md.",
    limitation: "Mídias de auditoria pesadas ficam fora do Git e residem exclusivamente no arquivamento da nuvem.",
  },
  {
    id: "roadmap-proximos",
    title: "O que o projeto está construindo nos próximos meses (Roadmap)?",
    answer:
      "A nossa prioridade estratégica de 90 dias é provar a adoção e utilidade real do portal antes de expandir a cobertura geográfica. Isso envolve: 1. Instrumentação robusta de analytics (cliques em fontes, buscas); 2. Garantia de 100% de confiabilidade e cobertura nas trilhas de Saúde e Educação de Sorocaba/SP; 3. Produção de relatórios quinzenais cívicos baseados nas análises; 4. Atração de usuários-alvo (jornalistas, assessores, conselhos de direitos). No roadmap futuro, as lacunas declaradas de Contratos, Obras Públicas e Autarquias serão curadas e publicadas.",
    answerSimple:
      "Em vez de tentar cobrir várias cidades de uma vez, nosso foco para os próximos meses é deixar os dados de Saúde e Educação de Sorocaba 100% perfeitos, auditados e fáceis de usar. Também estamos criando análises quinzenais e trazendo jornalistas e conselhos locais para usar a ferramenta. Depois, começaremos a cobrir contratos e obras públicas.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "roadmap", "futuro", "construindo", "proximos passos", "planos", "90 dias", "proximos meses", "expansao",
      "novidades", "metas", "planejamento", "sorocaba 100", "onde o projeto quer chegar", "o que falta fazer",
    ],
    links: [
      { href: "/sorocaba/lacunas", label: "Ver lacunas declaradas" },
      { href: "/sobre", label: "Sobre a missão" },
    ],
    source: "Plano estratégico em docs/roadmap.md e docs/estrategia.md.",
    limitation: "Os prazos são estimados com base na capacidade de trabalho voluntário cívico.",
  },
  {
    id: "voluntariado",
    title: "Como posso ser voluntário e ajudar o projeto?",
    answer:
      "Qualquer pessoa pode contribuir com a infraestrutura cívica! As principais frentes são: 1. Desenvolvimento (Next.js, Tailwind, Python) no nosso GitHub; 2. Análise de Dados e Auditoria (cruzar bases de dados municipais e encontrar achados relevantes); 3. Produção de Conteúdo e Divulgação (explicar as descobertas em formato de pauta cívica). O projeto opera com total segurança jurídica de acordo com a Lei do Voluntariado no Brasil (Lei nº 9.608/1998), com termos formais de adesão para proteger ambas as partes.",
    answerSimple:
      "Você pode nos ajudar de três formas: programando no site, analisando dados públicos de gastos para achar informações curiosas, ou escrevendo textos explicativos sobre o orçamento municipal. Para a segurança de todos, seguimos a Lei do Voluntariado, com um termo de adesão que formaliza a colaboração sem vínculo empregatício.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "voluntario", "voluntariado", "ajudar", "contribuir", "participar", "apoiar", "fazer parte", "trabalhar junto",
      "lei do voluntariado", "como ajudar", "colaborar", "quero ser voluntario", "contribuicao", "github contribuir",
    ],
    links: [
      { href: "/voluntarios", label: "Página de voluntários" },
      { href: "/contato", label: "Formulário de contato" },
      { href: "https://github.com/sallumc2018/anatomia-do-gasto", label: "GitHub do projeto" },
    ],
    source: "Estratégia de engajamento em docs/sorocaba-100-operacao.md.",
    limitation: "O trabalho voluntário é de adesão espontânea e sem qualquer remuneração financeira.",
  },
  {
    id: "sandbox-theo",
    title: "O que é este Sandbox do Théo?",
    answer:
      "O Sandbox do Théo é um laboratório interativo de testes e simulação do nosso assistente cívico virtual. Projetamos este ambiente focado para demonstrar todo o conhecimento que o Théo possui sobre o ecossistema da ONG: desde o nosso propósito fundamental e a stack de programação do site, até a engenharia de arquivos locais (Omega), o roadmap de desenvolvimento e o funcionamento da nossa IA interna.",
    answerSimple:
      "O Sandbox é o espaço de testes oficial do Théo. Criamos essa página especial para que você possa conversar com ele sobre a própria estrutura da nossa ONG, o código-fonte do site, as pastas do computador e as metas para o futuro do projeto.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "sandbox", "teste", "ambiente de teste", "treinamento", "laboratorio", "brincar", "simulacao", "o que e a pagina",
      "sandbox do theo", "theo sandbox", "perguntar para o theo", "guia de testes",
    ],
    links: [
      { href: "/sandbox", label: "Reiniciar sandbox" },
      { href: "/", label: "Página inicial" },
    ],
    source: "Documentação da interface do sandbox de simulação.",
    limitation: "O sandbox roda localmente no navegador por meio de uma base de conhecimento semântica estruturada.",
  },
  {
    id: "agentes-maestro",
    title: "O que são os Agentes Inteligentes e o Maestro do projeto?",
    answer:
      "O desenvolvimento do projeto e a curadoria de dados contam com o apoio de um ecossistema de Agentes Inteligentes de IA coordenados por um despachante central chamado Maestro (que gerencia o contexto mínimo). Há subagentes especializados, como o Frontino (para score e-SIC e LAI), o Plínio (para análise cidadã de planilhas), o Vitrúvio (desenvolvedor full-stack) e o Catão (watchdog de segurança). Todo o sistema é governado por regras rígidas de economia de tokens e as alterações no projeto são assinadas de forma auditável e pública em changes.csv.",
    answerSimple:
      "Para ajudar a programar o site e ler a papelada do governo, nós usamos agentes de inteligência artificial coordenados por um chefe chamado 'Maestro'. Cada agente tem uma tarefa: um cuida de segurança, outro de gráficos, outro de analisar dados. Para economizar custos, eles operam com limites de memória rígidos e registram cada linha de código alterada de forma transparente.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "agentes", "maestro", "ia", "inteligencia artificial", "bot", "automatizacao", "frontino", "plinio", "vitruvio",
      "subagentes", "rag", "economia de token", "tokens", "changes.csv", "maestro learning", "orquestrador", "codex",
    ],
    links: [
      { href: "https://github.com/sallumc2018/anatomia-do-gasto", label: "GitHub do projeto" },
      { href: "/sorocaba/auditoria", label: "Página de auditoria" },
    ],
    source: "Arquitetura operacional documentada em AI_MASTER_PROMPT.md e ORQUESTRADOR.md.",
    limitation: "Os agentes possuem autonomia estritamente controlada e dependem de aprovação humana para commits ou deploys.",
  },
  {
    id: "lai",
    title: "Como faço um pedido pela Lei de Acesso à Informação?",
    answer:
      "A Lei de Acesso à Informação (LAI, Lei 12.527/2011) garante que qualquer pessoa peça dados públicos sem justificar o motivo, de graça. O pedido é feito pelo e-SIC do órgão — na Prefeitura de Sorocaba, pelo portal de transparência, ou pelo Fala.BR no nível federal. O órgão tem 20 dias para responder, prorrogáveis por mais 10; se negarem ou não responderem, cabe recurso. Nesta seção explicamos o passo a passo e mostramos os pedidos que nós mesmos já protocolamos.",
    answerSimple:
      "A LAI é a lei que deixa qualquer cidadão pedir informação pública de graça, sem dizer por quê. Você faz o pedido pelo site de transparência do órgão (o sistema chama e-SIC) ou pelo Fala.BR. Eles têm 20 dias para responder (pode esticar mais 10). Se negarem, dá para recorrer. A gente mesmo já fez vários pedidos assim — e mostra quais aqui.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "lai", "lei de acesso", "acesso a informacao", "acesso à informação", "e-sic", "esic", "fala.br",
      "pedido de informacao", "como pedir", "como fazer pedido", "prazo da lai", "prazo do pedido", "prazo lai",
      "recorrer", "negativa", "recurso lai", "custo do pedido", "custo lai", "e gratis", "12527",
      "transparencia passiva", "solicitar dado", "pedir dado", "pedir informacao",
    ],
    links: [
      { href: "/sorocaba/acesso-a-informacao", label: "Acesso à informação" },
      { href: "/sorocaba/lacunas", label: "Lacunas e pedidos" },
    ],
    source: "Lei 12.527/2011 e pedidos e-SIC registrados pelo projeto.",
    limitation: "Orientação geral; prazos e canais podem variar conforme o órgão.",
  },
  {
    id: "transparencia-controle-social",
    title: "O que é transparência pública e controle social?",
    answer:
      "Transparência pública tem dois lados: a ativa, quando o governo publica dados por conta própria (portais e relatórios), e a passiva, quando você pede e ele responde, via LAI. Controle social é o papel da sociedade civil — cidadãos, ONGs, jornalistas — de acompanhar e fiscalizar o uso do dinheiro público. Este projeto existe justamente para tornar esse controle mais fácil.",
    answerSimple:
      "Transparência ativa é quando o governo já publica os dados sozinho. Transparência passiva é quando você precisa pedir (pela LAI). Controle social é o nome do papel que você, como cidadão, tem de acompanhar e cobrar o uso do dinheiro público. É pra isso que a gente existe: deixar isso fácil.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "transparencia", "transparencia publica", "transparencia ativa", "transparencia passiva",
      "controle social", "sociedade civil", "fiscalizar", "fiscalizacao", "papel do cidadao",
      "participacao popular", "accountability", "o que e transparencia", "prestacao de contas",
    ],
    links: [
      { href: "/sobre", label: "Sobre o projeto" },
      { href: "/sorocaba/acesso-a-informacao", label: "Acesso à informação" },
    ],
    source: "Conceitos da LC 131/2009 (Lei da Transparência) e da LAI.",
    limitation: "Conteúdo educativo; não substitui a leitura da legislação oficial.",
  },
  {
    id: "remuneracao",
    title: "Quanto ganha o prefeito ou os servidores?",
    answer:
      "A remuneração nominal de servidores e agentes públicos de Sorocaba ainda não está publicada aqui. O dado existe no portal de transparência da Prefeitura, mas em formato que ainda não conseguimos extrair de modo confiável e auditável — por isso está marcado como lacuna e foi incluído nos nossos pedidos de informação. Assim que tivermos a série tratada, ela aparece aqui.",
    answerSimple:
      "Ainda não temos publicado quanto ganha o prefeito ou cada servidor. Esse dado está no portal da Prefeitura, mas num formato difícil de extrair com segurança — então marcamos como lacuna e já pedimos oficialmente. Quando conseguirmos, mostramos aqui.",
    status: "Lacuna",
    confidence: "Alta",
    keywords: [
      "quanto ganha", "salario", "salário", "remuneracao", "remuneração", "vencimento", "folha de pagamento",
      "quanto ganha o prefeito", "salario do prefeito", "salario servidor", "salario do vereador",
      "subsidio", "holerite", "contracheque", "quanto ganha vereador", "quanto ganha servidor",
    ],
    links: [
      { href: "/sorocaba/lacunas", label: "Lacunas conhecidas" },
      { href: "/sorocaba/acesso-a-informacao", label: "Acesso à informação" },
    ],
    source: "Pendência registrada nas lacunas e nos pedidos e-SIC do projeto.",
    limitation: "Remuneração nominal ainda não publicada de forma auditável.",
  },
  {
    id: "apartidarismo",
    title: "O projeto é de algum partido ou do governo?",
    answer:
      "Não. O Anatomia do Gasto é um projeto independente, apartidário e sem vínculo com nenhum governo, candidato ou partido. Não recebemos recursos públicos nem fazemos campanha por ninguém. Mostramos os dados oficiais como eles são, sem opinião sobre quem está certo ou errado — a leitura política de quem governa fica com você.",
    answerSimple:
      "Não. A gente não é de partido nenhum, nem do governo. É um projeto independente, feito por cidadãos. Não recebemos dinheiro público e não defendemos nenhum político. Só mostramos os dados oficiais; a conclusão é sua.",
    status: "Disponível",
    confidence: "Alta",
    keywords: [
      "partido", "apartidario", "apartidário", "politico", "esquerda", "direita", "do governo",
      "oposicao", "candidato", "eleicao", "eleição", "quem ganhou", "ideologia", "tendencia",
      "neutralidade", "imparcial", "vies", "viés", "a ong e de quem", "quem esta por tras",
    ],
    links: [
      { href: "/politica-de-neutralidade", label: "Política de neutralidade" },
      { href: "/sobre", label: "Sobre o projeto" },
    ],
    source: "Política de neutralidade declarada do projeto.",
    limitation: "Não comentamos disputas eleitorais nem fazemos juízo político.",
  },
]

const FALLBACK_ROUTE = (() => {
  const r = THEO_ROUTES.find((route) => route.id === "fontes")
  if (!r) throw new Error("Rota 'fontes' ausente em THEO_ROUTES — fallback inválido")
  return r
})()

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

function scoreRoute(route: TheoRoute, query: string) {
  const normalizedQuery = normalize(query)
  return route.keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalize(keyword)
    if (normalizedQuery.includes(normalizedKeyword)) return score + 3
    if (normalizedKeyword.split(" ").some((part) => part.length > 3 && normalizedQuery.includes(part))) return score + 1
    return score
  }, 0)
}

type RouteMatch = {
  route: TheoRoute
  score: number
}

function findBestMatch(query: string): RouteMatch {
  let best: RouteMatch = { route: FALLBACK_ROUTE, score: 0 }
  for (const route of THEO_ROUTES) {
    const s = scoreRoute(route, query)
    if (s > best.score) best = { route, score: s }
  }
  return best
}

export default function TheoGuide({ initialQuery = "" }: { initialQuery?: string }) {
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery)
    setQuery(initialQuery)
    setSubmittedQuery(initialQuery)
  }

  const result = useMemo(
    () => (submittedQuery ? findBestMatch(submittedQuery) : null),
    [submittedQuery]
  )
  const formality = useMemo(() => detectFormality(submittedQuery), [submittedQuery])
  const answer = result?.route
  const isFallback = !!submittedQuery && (result?.score ?? 0) === 0
  const displayAnswer =
    answer && formality === "simples" && answer.answerSimple
      ? answer.answerSimple
      : answer?.answer

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = query.trim()
    if (next) {
      setSubmittedQuery(next)
      setQuery("")
    }
  }

  return (
    <section id="theo" className="theo-chat" aria-label="Guia de perguntas">
      <form className="theo-chat__composer" onSubmit={submitQuestion}>
        <div>
          <input
            id="theo-question"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pergunte sobre Sorocaba ou sobre a nossa ONG…"
            aria-label="Pergunte ao Théo"
          />
          <button type="submit" aria-label="Enviar pergunta">→</button>
        </div>
      </form>

      <p
        role="note"
        style={{
          margin: "10px 0 0",
          padding: "8px 12px",
          fontSize: "12px",
          lineHeight: "18px",
          color: "var(--text-03)",
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border-02)",
          borderRadius: "6px",
        }}
      >
        🛈 O Théo ainda está <strong>em treinamento</strong>. Ele é um guia em construção e responde a um conjunto
        limitado de perguntas — se não encontrar o que você procura, tente outras palavras ou navegue pelo site.
      </p>

      {answer && (
        <div className="theo-chat__answer" role="region" aria-live="polite" aria-label="Resposta">
          {isFallback && (
            <p className="theo-chat__fallback-notice">
              Não encontrei uma resposta específica. Tente: receita, gasto, empenho, vereador, dívida.
            </p>
          )}

          {answer.status !== "Disponível" && (
            <p className={`theo-chat__status-notice theo-chat__status-notice--${answer.status === "Lacuna" ? "lacuna" : "coleta"}`}>
              {answer.status === "Lacuna" ? "Dado não publicado ainda" : "Em processo de coleta"}{" — "}{answer.limitation}
            </p>
          )}

          <h4>{answer.title}</h4>
          <p>{displayAnswer}</p>

          <div className="theo-chat__links">
            {answer.links.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </div>

          <p className="theo-chat__trace">{answer.source}</p>
        </div>
      )}
    </section>
  )
}
