import type { Metadata } from "next"
import {
  SaudeFiscalPage,
  type SaudeFiscalPageConfig,
} from "@/components/municipios/saude-fiscal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
const DATASET = datasetSchema({
  name: "Saúde fiscal (LRF/RGF) — São Paulo 2020–2025",
  description: "Indicadores de responsabilidade fiscal de São Paulo conforme a Lei de Responsabilidade Fiscal: despesa com pessoal, dívida consolidada, Receita Corrente Líquida (RCL) e verificação dos limites legais. Fonte: RGF/SICONFI. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/saude-fiscal`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["LRF", "Lei de Responsabilidade Fiscal", "RGF", "despesa com pessoal", "dívida consolidada", "RCL", "São Paulo"],
  dateModified: "2026-06-20",
  downloadUrls: [
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_${ano}.csv`),
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_${ano}.csv`),
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_${ano}.csv`),
  ],
})

const CONFIG = {
  dataMunicipio: "sao_paulo",
  nome: "São Paulo",
  heroSubject: "São Paulo",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
      { name: "Saúde fiscal (LRF)" },
    ]),
  ],
  detailedDebt: true,
  rppsLabel: "RPPS municipal",
  heroSourceText: "Dados extraídos do RGF (Relatório de Gestão Fiscal) e do RREO publicados no SICONFI pelo Tesouro Nacional.",
  debtBaseHero: "base ajustada do RGF",
  debtBaseInsight: "base ajustada informada no RGF",
  debtBaseDcl: "base ajustada informada no RGF",
  debtKpiNote: "da base ajustada do RGF — limite: 120%",
  debtHeading: "Endividamento como % da base ajustada",
  debtExplanation: "O limite máximo é 120% da base ajustada informada no RGF (Resolução do Senado 40/2001). A DCL desconta as disponibilidades de caixa do total da dívida consolidada.",
  debtChartLabel: "DC bruta % da base ajustada — limite: 120%",
  sourceCards: [
    { title: "RGF Anexo 01", text: "Despesa com Pessoal — Relatório de Gestão Fiscal do Poder Executivo, periodicidade semestral." },
    { title: "RGF Anexo 02", text: "Dívida Consolidada e Deduções — Relatório de Gestão Fiscal do Poder Executivo, semestral." },
    { title: "RREO Anexo 03", text: "Demonstrativo da Receita Corrente Líquida — publicado bimestralmente no SICONFI." },
  ],
  navLinks: [
    { href: "/sao-paulo", label: "← São Paulo" },
    { href: "/sao-paulo/executivo", label: "Orçamento total" },
    { href: "/sao-paulo/receita", label: "Receitas" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies SaudeFiscalPageConfig

export const metadata: Metadata = {
  title: "Saúde Fiscal de São Paulo",
  description:
    "Despesa com pessoal, dívida consolidada e Receita Corrente Líquida de São Paulo 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/saude-fiscal` },
}

export default function SaoPauloSaudeFiscalPage() {
  return <SaudeFiscalPage config={CONFIG} />
}
