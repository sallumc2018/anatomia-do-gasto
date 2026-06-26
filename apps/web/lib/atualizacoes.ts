export interface Atualizacao {
  id: string
  slug: string
  titulo: string
  data: string
  municipios: string[]
  tags: string[]
  resumo: string
  corpo: string
  datasets: Array<{ label: string; href: string }>
}

export const ATUALIZACOES: Atualizacao[] = [
  {
    id: "paulinia-expansao-paginas-2026-06",
    slug: "paulinia-expansao-paginas-2026-06",
    titulo: "Paulínia completa: contratos PNCP, fornecedores, educação e controle externo publicados",
    data: "2026-06-25",
    municipios: ["3536505"],
    tags: ["paulinia", "contratos", "fornecedores", "educação", "tce-sp", "transparência"],
    resumo: "Quatro novas seções de Paulínia publicadas: educação (RREO 2020–2025), contratos PNCP (1.063 contratos 2023–2026), fornecedores/empenhos (188k empenhos 2020–2026) e controle externo com pareceres prévios do TCE-SP (6 desfavoráveis em 10 exercícios).",
    corpo: `O Anatomia do Gasto expandiu a cobertura do Município de Paulínia/SP com quatro novas seções de dados públicos.

**Educação — gasto com MDE (2020–2025)**

A página de educação mostra o gasto do Município de Paulínia com educação a partir do RREO Anexo 02 (função 12). Os dados cobrem dotação inicial, dotação atualizada e liquidado, com série histórica 2020–2025. O gasto liquidado em educação alcançou R$ 655 milhões em 2025, representando aproximadamente 23% do orçamento total executado.

**Contratos e licitações — PNCP (2023–2026)**

1.063 contratos publicados no Portal Nacional de Contratações Públicas (PNCP) entre 2023 e 2026, totalizando R$ 1,07 bilhão em valor global contratado. Dados cobrem modalidade (pregão eletrônico, dispensa, inexigibilidade), valor global, datas de vigência e links diretos para os documentos no PNCP.

**Fornecedores e empenhos (2020–2026)**

188 mil empenhos registrados no portal SMARAPD de Paulínia, com os maiores credores do município por ano. Em 2025, foram 35,6 mil empenhos; os 8 maiores credores (excluindo empenhos intragovernamentais) responderam pela maior parte dos gastos. Dados disponíveis por exercício em CSV.

**Controle externo — TCE-SP (2008–2017)**

Inventário dos pareceres prévios do Tribunal de Contas do Estado de São Paulo sobre as contas anuais do Prefeito de Paulínia. Entre 2008 e 2017, o TCE-SP emitiu 6 pareceres desfavoráveis e 4 favoráveis. A virada para desfavorável coincide com o período 2012–2017. Todos os documentos com links diretos ao AUDESP/TCE-SP.`,
    datasets: [
      { label: "Educação — Paulínia 2020–2025", href: "/paulinia/educacao" },
      { label: "Contratos PNCP — Paulínia 2023–2026", href: "/paulinia/contratos" },
      { label: "Fornecedores e empenhos — Paulínia 2020–2026", href: "/paulinia/fornecedores" },
      { label: "Controle externo TCE-SP — Paulínia", href: "/paulinia/controle-externo" },
    ],
  },
  {
    id: "sprint1-expansao-sp",
    slug: "sprint1-expansao-sp",
    titulo: "Sprint 1: expansão para 18 municípios do estado de São Paulo",
    data: "2026-06-22",
    municipios: ["3548708", "3529401", "3547809", "3504009", "3552900", "3551009", "3549805", "3543402", "3516200", "3549953", "3534401", "3513801", "3534006", "3523107", "3506003", "3518800", "3509502", "3556453"],
    tags: ["expansão", "sprint1", "são-paulo", "coleta"],
    resumo: "Coleta de dados federais expandida para 18 municípios do estado de São Paulo: convênios do Portal da Transparência, emendas parlamentares federais e repasses FNS. Dados disponíveis via API pública.",
    corpo: `O projeto Anatomia do Gasto expandiu sua cobertura de coleta de dados federais para 18 municípios do estado de São Paulo além da capital.

A expansão Sprint 1 cobre municípios como São Bernardo do Campo, Guarulhos, Campinas, Santo André, Osasco, Ribeirão Preto, São José dos Campos, Mauá, São José do Rio Preto, Santos, Mogi das Cruzes, Diadema, Jundiaí, Carapicuíba, Piracicaba, Bauru, Itaquaquecetuba e São Vicente.

**Fontes coletadas para cada município:**
- Convênios firmados com o governo federal (Portal da Transparência, 2024–2026)
- Emendas parlamentares federais (2014–2026)
- Repasses do Fundo Nacional de Saúde — FNS (2024–2026)

Os dados são transferências fundo-a-fundo e convênios diretos do governo federal aos municípios, sem intermediação estadual. Todos os arquivos estão disponíveis via API pública em formato CSV.`,
    datasets: [
      { label: "API pública — catálogo completo", href: "/api/dados" },
    ],
  },
  {
    id: "api-publica-v1",
    slug: "api-publica-v1",
    titulo: "API pública v1 lançada — orçamento e fornecedores disponíveis para download",
    data: "2026-06-21",
    municipios: ["3552205", "3536505", "3550308"],
    tags: ["api", "dados-abertos", "csv", "sorocaba", "paulinia", "sao-paulo"],
    resumo: "A API pública v1 do Anatomia do Gasto disponibiliza acesso programático a todos os CSVs publicados de Sorocaba, Paulínia e São Paulo via endpoint /api/dados/[municipio]/[area]/saida/[arquivo].csv.",
    corpo: `O Anatomia do Gasto lançou a versão 1 da sua API pública de dados, disponibilizando acesso programático a todos os arquivos CSV publicados pelo projeto.

**Como acessar:**

Todos os arquivos seguem o padrão de URL:
\`\`\`
https://www.anatomiadogasto.ong.br/api/dados/{municipio}/{area}/saida/{arquivo}.csv
\`\`\`

Exemplos:
- Fornecedores de Sorocaba 2024: \`/api/dados/sorocaba/fornecedores/saida/fornecedores_conta_corrente_sorocaba_2024.csv\`
- Orçamento de São Paulo 2024: \`/api/dados/sao_paulo/executivo/saida/rreo_funcao_sao_paulo_2024.csv\`
- Repasses FNS São Paulo 2025: \`/api/dados/sao_paulo/fns/saida/fns_repasses_faf_com_populacao_sao_paulo_2025.csv\`

**Dados disponíveis:**

Para Sorocaba: saúde, educação, segurança pública, transporte, orçamento executivo, receitas, fornecedores, saúde fiscal e empenhos.

Para Paulínia: segurança pública, transporte, receitas, orçamento executivo, saúde fiscal, saúde, transferências, câmara municipal, educação, contratos PNCP, fornecedores/empenhos e controle externo (TCE-SP).

Para São Paulo: orçamento total (RREO), receitas, segurança, transporte, saúde fiscal e repasses FNS de saúde.

**Licença:** CC BY 4.0. Atribuição obrigatória ao projeto e à fonte oficial original.`,
    datasets: [
      { label: "Catálogo completo de datasets", href: "/api/dados" },
      { label: "Como citar", href: "/como-citar" },
    ],
  },
  {
    id: "fns-sao-paulo-2020-2025",
    slug: "fns-sao-paulo-2020-2025",
    titulo: "Repasses FNS publicados — São Paulo recebeu R$ 10–11 bi/ano em saúde federal",
    data: "2026-06-18",
    municipios: ["3550308"],
    tags: ["fns", "saúde", "são-paulo", "federal"],
    resumo: "Série histórica 2020–2025 dos repasses do Fundo Nacional de Saúde ao Município de São Paulo publicada. Em 2025, o FNS transferiu mais de R$ 10 bilhões diretamente ao Fundo Municipal de Saúde.",
    corpo: `O Anatomia do Gasto publicou a série histórica completa dos repasses do Fundo Nacional de Saúde (FNS) ao Município de São Paulo, cobrindo os anos de 2020 a 2025.

**Por que São Paulo recebe o maior volume:**

São Paulo, por ser o maior município do Brasil em população (≈ 12 milhões de habitantes), recebe o maior volume absoluto de repasses federais de saúde do país. Os dados mostram transferências anuais entre R$ 10 bilhões e R$ 11 bilhões no período.

**Custeio vs. investimento:**

Os repasses do FNS são organizados em dois blocos principais: custeio (manutenção de serviços como UBS, CAPS, SAMU, hospitais municipais e vigilância sanitária) e investimento (obras e equipamentos). Historicamente, o custeio representa mais de 95% do total.

**Mecanismo fundo-a-fundo:**

Os repasses saem diretamente do Fundo Nacional de Saúde para o Fundo Municipal de Saúde (FMS-SP), sem intermediação estadual. Isso garante rastreabilidade: os recursos só podem ser usados nas ações previstas no Programa Anual de Saúde do município.

**Fonte:** Fundo Nacional de Saúde (FNS/Ministério da Saúde) — transferências fundo-a-fundo (FAF) por município. Município de São Paulo: código IBGE 3550308.`,
    datasets: [
      { label: "Página de repasses FNS — São Paulo", href: "/sao-paulo/saude" },
      { label: "CSV FNS 2025", href: "/api/dados/sao_paulo/fns/saida/fns_repasses_faf_com_populacao_sao_paulo_2025.csv" },
      { label: "CSV FNS 2024", href: "/api/dados/sao_paulo/fns/saida/fns_repasses_faf_com_populacao_sao_paulo_2024.csv" },
    ],
  },
]

export function getAtualizacao(slug: string): Atualizacao | undefined {
  return ATUALIZACOES.find((a) => a.slug === slug)
}
