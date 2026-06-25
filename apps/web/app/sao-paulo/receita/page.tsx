import type { Metadata } from "next"
import {
  ReceitaMunicipalPage,
  type ReceitaMunicipalPageConfig,
} from "@/components/municipios/receita-municipal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Receitas municipais — São Paulo 2020–2025",
  description: "Receitas do Município de São Paulo por categoria e espécie (RREO Anexo 01/SICONFI): impostos próprios (ISS, IPTU, ITBI), transferências da União (FPM, IR, IPI), ICMS/IPVA estaduais e demais fontes. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/receita`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["receitas São Paulo", "ISS", "IPTU", "FPM", "ICMS", "RREO", "arrecadação municipal"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024, 2025].map(
    (ano) => `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_${ano}.csv`,
  ),
})

const BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: SITE_URL },
  { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
  { name: "Receitas municipais" },
])

const CONFIG = {
  dataMunicipio: "sao_paulo",
  slug: "sao-paulo",
  nome: "São Paulo",
  ibge: "3550308",
  structuredData: [DATASET, BREADCRUMB],
  contextParagraphs: [
    "São Paulo é o maior município do Brasil e detém o maior orçamento municipal do país. Sua arrecadação própria é puxada principalmente pelo ISS (imposto sobre serviços) e pelo IPTU, complementada pelas transferências da União e do Estado de SP.",
  ],
  compositionParagraphs: [
    "Combina arrecadação tributária própria (com destaque para ISS e IPTU) e transferências correntes da União e do Estado de SP.",
    "A composição exata por categoria está detalhada na tabela abaixo, extraída diretamente do RREO Anexo 01 publicado no SICONFI.",
  ],
  transferInsightSuffix: " — inclui a cota-parte do ICMS e do FPM repassada ao município.",
  rppsLabel: "RPPS municipal",
  showIntraWhenZero: true,
  methodologyTitle: "Maior município do Brasil",
  methodologyText: "São Paulo concentra o maior orçamento municipal do país. A arrecadação própria é sustentada por uma ampla base de ISS (serviços) e IPTU, complementada pelas transferências constitucionais da União (FPM) e do Estado de SP (cota-parte do ICMS).",
  navLinks: [
    { href: "/sao-paulo", label: "← São Paulo" },
    { href: "/sao-paulo/executivo", label: "Orçamento total" },
    { href: "/sao-paulo/saude-fiscal", label: "Saúde fiscal" },
    { href: "/sao-paulo/seguranca", label: "Segurança" },
  ],
} satisfies ReceitaMunicipalPageConfig

export const metadata: Metadata = {
  title: "Receita Municipal de São Paulo",
  description:
    "De onde vêm os recursos de São Paulo: impostos próprios (ISS, IPTU), ICMS/IPVA estaduais e transferências federais. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/receita` },
}

export default function SaoPauloReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  return <ReceitaMunicipalPage searchParams={searchParams} config={CONFIG} />
}
