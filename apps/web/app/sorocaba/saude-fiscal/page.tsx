import type { Metadata } from "next"
import {
  SaudeFiscalPage,
  type SaudeFiscalPageConfig,
} from "@/components/municipios/saude-fiscal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"
import { SorocabaSaudeFiscalExtraSections } from "./extra-sections"

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]

const DATASET = datasetSchema({
  name: "Saúde fiscal (LRF/RGF) — Sorocaba 2020–2025",
  description:
    "Indicadores de responsabilidade fiscal de Sorocaba: despesa com pessoal, dívida consolidada e RCL. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: RGF/SICONFI. IBGE 3552205.",
  url: `${SITE_URL}/sorocaba/saude-fiscal`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "Sorocaba, SP, Brasil (IBGE 3552205)",
  keywords: ["LRF", "responsabilidade fiscal", "RGF", "despesa com pessoal", "dívida", "Sorocaba"],
  dateModified: "2026-06-20",
  downloadUrls: [
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sorocaba/fiscal/saida/pessoal_sorocaba_${ano}.csv`),
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sorocaba/fiscal/saida/divida_detalhada_sorocaba_${ano}.csv`),
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sorocaba/fiscal/saida/rcl_sorocaba_${ano}.csv`),
  ],
})

const CONFIG = {
  dataMunicipio: "sorocaba",
  nome: "Sorocaba",
  heroSubject: "Sorocaba",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "Sorocaba", url: `${SITE_URL}/sorocaba` },
      { name: "Saúde fiscal (LRF)" },
    ]),
  ],
  detailedDebt: true,
  rppsLabel: "RPPS",
  heroSourceText:
    "Dados extraídos do RGF (Relatório de Gestão Fiscal) e do RREO (Relatório Resumido da Execução Orçamentária) publicados no SICONFI pelo Tesouro Nacional.",
  debtBaseHero: "base ajustada do RGF",
  debtBaseInsight: "base ajustada informada no RGF",
  debtBaseDcl: "base ajustada informada no RGF",
  debtKpiNote: "da base ajustada do RGF — limite Senado: 120%",
  debtHeading: "Endividamento como % da base ajustada",
  debtExplanation:
    "O limite máximo é 120% da base ajustada informada no RGF (Resolução do Senado Federal 40/2001). A Dívida Consolidada Líquida (DCL) desconta as disponibilidades de caixa do total da dívida consolidada.",
  debtChartLabel: "DC bruta % da base ajustada — limite: 120%",
  debtInsightSuffix: " Sorocaba mantém ampla capacidade de endividamento não utilizada.",
  extraSections: <SorocabaSaudeFiscalExtraSections />,
  sourceCards: [
    { title: "RGF Anexo 01", text: "Despesa com Pessoal — Relatório de Gestão Fiscal do Poder Executivo, periodicidade semestral." },
    { title: "RGF Anexo 02", text: "Dívida Consolidada e Deduções — Relatório de Gestão Fiscal do Poder Executivo, semestral." },
    { title: "RREO Anexo 03", text: "Demonstrativo da Receita Corrente Líquida — publicado bimestralmente no SICONFI." },
  ],
  navLinks: [
    { href: "/sorocaba", label: "← Sorocaba" },
    { href: "/sorocaba/executivo", label: "Orçamento total" },
    { href: "/sorocaba/receita", label: "Receitas" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies SaudeFiscalPageConfig

export const metadata: Metadata = {
  title: "Saúde Fiscal de Sorocaba",
  description:
    "Despesa com pessoal, dívida consolidada e Receita Corrente Líquida de Sorocaba 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/sorocaba/saude-fiscal` },
}

export default function SorocabaSaudeFiscalPage() {
  return <SaudeFiscalPage config={CONFIG} />
}
