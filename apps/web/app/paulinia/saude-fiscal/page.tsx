import type { Metadata } from "next"
import {
  SaudeFiscalPage,
  type SaudeFiscalPageConfig,
} from "@/components/municipios/saude-fiscal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Saúde fiscal (LRF/RGF) — Paulínia 2020–2024",
  description: "Indicadores de responsabilidade fiscal de Paulínia: despesa com pessoal, dívida consolidada e RCL. Comparação com os limites da LRF. Fonte: RGF/SICONFI. IBGE 3536505.",
  url: `${SITE_URL}/paulinia/saude-fiscal`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  keywords: ["LRF", "responsabilidade fiscal", "RGF", "dívida", "Paulínia"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) => `${SITE_URL}/api/dados/paulinia/fiscal/saida/divida_detalhada_paulinia_${ano}.csv`,
  ),
})

const CONFIG = {
  dataMunicipio: "paulinia",
  nome: "Paulínia",
  heroSubject: "Paulínia",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "Paulínia", url: `${SITE_URL}/paulinia` },
      { name: "Saúde fiscal (LRF)" },
    ]),
  ],
  detailedDebt: true,
  rppsLabel: "RPPS (Paulínia Previ)",
  heroSourceText: "Dados extraídos do RGF (Relatório de Gestão Fiscal) e do RREO publicados no SICONFI pelo Tesouro Nacional.",
  debtBaseHero: "base ajustada do RGF",
  debtBaseInsight: "base ajustada informada no RGF",
  debtBaseDcl: "base ajustada",
  debtKpiNote: "da base ajustada do RGF — limite: 120%",
  debtHeading: "Endividamento como % da base ajustada",
  debtExplanation: "O limite máximo é 120% da base ajustada informada no RGF (Resolução do Senado 40/2001). A DCL desconta as disponibilidades de caixa — Paulínia mantém caixa expressivo.",
  debtChartLabel: "DC bruta % da base ajustada — limite: 120%",
  debtInsightSuffix: " Paulínia historicamente mantém caixa elevado em função das receitas de royalties.",
  sourceCards: [
    { title: "RGF Anexo 01", text: "Despesa com Pessoal — Relatório de Gestão Fiscal do Poder Executivo, periodicidade semestral." },
    { title: "RGF Anexo 02", text: "Dívida Consolidada e Deduções — Relatório de Gestão Fiscal do Poder Executivo, semestral." },
    { title: "RREO Anexo 03", text: "Demonstrativo da Receita Corrente Líquida — publicado bimestralmente no SICONFI." },
  ],
  navLinks: [
    { href: "/paulinia", label: "← Paulínia" },
    { href: "/paulinia/executivo", label: "Orçamento total" },
    { href: "/paulinia/receita", label: "Receitas" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies SaudeFiscalPageConfig

export const metadata: Metadata = {
  title: "Saúde Fiscal de Paulínia",
  description:
    "Despesa com pessoal, dívida consolidada e Receita Corrente Líquida de Paulínia 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/paulinia/saude-fiscal` },
}

export default function PauliniaSaudeFiscalPage() {
  return <SaudeFiscalPage config={CONFIG} />
}
