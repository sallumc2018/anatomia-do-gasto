export const SITE_URL = "https://www.anatomiadogasto.ong.br"
const REPOSITORY_URL = "https://github.com/sallumc2018/anatomia-do-gasto"

export function faqPageSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }
}

export function datasetSchema(config: {
  name: string
  description: string
  url: string
  temporalCoverage: string
  spatialCoverage: string
  keywords: string[]
  dateModified?: string
  downloadUrls?: string[]
}) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: config.name,
    description: config.description,
    url: config.url,
    creator: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    license: "https://creativecommons.org/licenses/by/4.0/",
    inLanguage: "pt-BR",
    temporalCoverage: config.temporalCoverage,
    spatialCoverage: { "@type": "Place", name: config.spatialCoverage },
    keywords: config.keywords,
    includedInDataCatalog: { "@id": `${SITE_URL}/api/dados#catalog` },
  }
  if (config.dateModified) base.dateModified = config.dateModified
  if (config.downloadUrls) {
    base.distribution = config.downloadUrls.map((url) => ({
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: url,
    }))
  }
  return base
}

export function breadcrumbSchema(items: Array<{ name: string; url?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, url }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(url ? { item: url } : {}),
    })),
  }
}

export function municipioDataCatalogSchema(config: {
  municipioId: string
  name: string
  description: string
  spatialCoverage: string
  datasets: Array<{ name: string; url: string }>
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "@id": `${SITE_URL}/${config.municipioId}#catalog`,
    name: config.name,
    description: config.description,
    url: `${SITE_URL}/${config.municipioId}`,
    inLanguage: "pt-BR",
    spatialCoverage: { "@type": "Place", name: config.spatialCoverage },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: { "@id": `${SITE_URL}/api/dados#catalog` },
    dataset: config.datasets.map(({ name, url }) => ({
      "@type": "Dataset",
      name,
      url: `${SITE_URL}${url}`,
    })),
  }
}

export function globalStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Anatomia do Gasto",
        url: SITE_URL,
        email: "contato@anatomiadogasto.ong.br",
        foundingLocation: {
          "@type": "Country",
          name: "Brasil",
        },
        description:
          "Projeto cívico independente que organiza dados fiscais públicos brasileiros em linguagem cidadã, com fontes oficiais, metodologia aberta e rastreabilidade.",
        sameAs: [REPOSITORY_URL],
        knowsAbout: [
          "orçamento público",
          "gasto público municipal",
          "transparência pública",
          "controle social",
          "SIOPS",
          "SICONFI",
          "dados públicos oficiais",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Anatomia do Gasto",
        url: SITE_URL,
        inLanguage: "pt-BR",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        description:
          "Site de visualização, documentação e rastreabilidade de dados fiscais públicos municipais.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/api/dados?busca={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": `${REPOSITORY_URL}#source-code`,
        name: "anatomia-do-gasto",
        codeRepository: REPOSITORY_URL,
        license: "https://github.com/sallumc2018/anatomia-do-gasto/blob/main/LICENSE",
        programmingLanguage: ["TypeScript", "Python"],
        runtimePlatform: "Next.js",
        isPartOf: {
          "@id": `${SITE_URL}/#website`,
        },
        description:
          "Repositório público com site, validadores, pipelines, documentação e dados publicados pela Anatomia do Gasto.",
      },
      {
        "@type": "DataCatalog",
        "@id": `${SITE_URL}/api/dados#catalog`,
        name: "Catálogo de dados publicados da Anatomia do Gasto",
        url: `${SITE_URL}/api/dados`,
        inLanguage: "pt-BR",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        includedInDataCatalog: `${SITE_URL}/fontes`,
        measurementTechnique:
          "Extração, normalização e validação local de bases públicas oficiais antes da publicação em data/public.",
        description:
          "Catálogo dos arquivos CSV publicados pelo projeto, com dados fiscais municipais oriundos de portais oficiais e bases federais.",
      },
    ],
  }
}
