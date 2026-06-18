const SITE_URL = "https://www.anatomiadogasto.ong.br"
const REPOSITORY_URL = "https://github.com/sallumc2018/anatomia-do-gasto"

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
          "Projeto civico independente que organiza dados fiscais publicos brasileiros em linguagem cidada, com fontes oficiais, metodologia aberta e rastreabilidade.",
        sameAs: [REPOSITORY_URL],
        knowsAbout: [
          "orcamento publico",
          "gasto publico municipal",
          "transparencia publica",
          "controle social",
          "SIOPS",
          "SICONFI",
          "dados publicos oficiais",
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
          "Site de visualizacao, documentacao e rastreabilidade de dados fiscais publicos municipais.",
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
          "Repositorio publico com site, validadores, pipelines, documentacao e dados publicados pela Anatomia do Gasto.",
      },
      {
        "@type": "DataCatalog",
        "@id": `${SITE_URL}/api/dados#catalog`,
        name: "Catalogo de dados publicados da Anatomia do Gasto",
        url: `${SITE_URL}/api/dados`,
        inLanguage: "pt-BR",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        includedInDataCatalog: `${SITE_URL}/fontes`,
        measurementTechnique:
          "Extracao, normalizacao e validacao local de bases publicas oficiais antes da publicacao em data/public.",
        description:
          "Catalogo dos arquivos CSV publicados pelo projeto, com dados fiscais municipais oriundos de portais oficiais e bases federais.",
      },
    ],
  }
}
