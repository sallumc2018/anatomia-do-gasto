import type { Metadata } from "next"
import {
  SaudeFiscalPage,
  type SaudeFiscalPageConfig,
} from "@/components/municipios/saude-fiscal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Saúde fiscal (LRF/RGF) — São Bernardo do Campo 2020–2024",
  description: "Indicadores de responsabilidade fiscal de São Bernardo do Campo: dívida consolidada e RCL. Comparação com os limites da LRF. Fonte: RGF/SICONFI. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/saude-fiscal`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["LRF", "responsabilidade fiscal", "dívida", "São Bernardo do Campo", "ABC Paulista"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) => `${SITE_URL}/api/dados/sao_bernardo/fiscal/saida/divida_sao_bernardo_${ano}.csv`,
  ),
})

const CONFIG = {
  dataMunicipio: "sao_bernardo",
  nome: "São Bernardo do Campo",
  heroSubject: "SBC",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
      { name: "Saúde fiscal (LRF)" },
    ]),
  ],
  detailedDebt: false,
  rppsLabel: "RPPS",
  heroSourceText: "Dados extraídos do RGF (Relatório de Gestão Fiscal) publicado no SICONFI pelo Tesouro Nacional.",
  debtBaseHero: "RCL",
  debtBaseInsight: "RCL informada no RGF",
  debtBaseDcl: "base",
  debtKpiNote: "da RCL — limite: 120%",
  debtHeading: "Endividamento como % da RCL",
  debtExplanation:
    "A Dívida Consolidada Líquida (DCL) é comparada à Receita Corrente Líquida (RCL), conforme a Resolução do Senado nº 40/2001.",
  debtChartLabel: "DC bruta % da RCL — limite: 120%",
  sourceCards: [
    {
      title: "RGF Anexo 01",
      text: "Despesa com Pessoal — Relatório de Gestão Fiscal do Poder Executivo, periodicidade semestral.",
    },
    {
      title: "RGF Anexo 02",
      text: "Dívida Consolidada — Relatório de Gestão Fiscal. Base: 3º quadrimestre (encerramento do exercício).",
    },
    {
      title: "Referência legal",
      text: "Lei Complementar 101/2000 (LRF) · Resolução do Senado Federal 40/2001 (limite de dívida) · Nota STN sobre limite de alerta (90% do limite máximo).",
    },
  ],
  navLinks: [
    { href: "/sao-bernardo", label: "← São Bernardo" },
    { href: "/sao-bernardo/receita", label: "Receitas" },
    { href: "/sao-bernardo/seguranca", label: "Segurança" },
    { href: "/sao-bernardo/transporte", label: "Transporte" },
  ],
} satisfies SaudeFiscalPageConfig

export const metadata: Metadata = {
  title: "Saúde Fiscal de São Bernardo do Campo",
  description:
    "Despesa com pessoal e dívida consolidada de São Bernardo do Campo 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/saude-fiscal` },
}

export default function Page() {
  return <SaudeFiscalPage config={CONFIG} />
}
