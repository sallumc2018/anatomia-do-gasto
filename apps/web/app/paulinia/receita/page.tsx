import type { Metadata } from "next"
import {
  ReceitaMunicipalPage,
  type ReceitaMunicipalPageConfig,
} from "@/components/municipios/receita-municipal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Receitas municipais — Paulínia 2020–2024",
  description: "Receitas do Município de Paulínia: impostos, royalties REPLAN, cota-parte ICMS/IPVA, FPM e transferências intergovernamentais. Fonte: RREO Anexo 01/SICONFI. IBGE 3536505.",
  url: `${SITE_URL}/paulinia/receita`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  keywords: ["receita municipal", "REPLAN", "royalties", "ICMS", "FPM", "Paulínia", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) => `${SITE_URL}/api/dados/paulinia/receita/saida/receitas_paulinia_${ano}.csv`,
  ),
})

const BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: SITE_URL },
  { name: "Paulínia", url: `${SITE_URL}/paulinia` },
  { name: "Receitas municipais" },
])

const CONFIG = {
  dataMunicipio: "paulinia",
  slug: "paulinia",
  nome: "Paulínia",
  ibge: "3536505",
  structuredData: [DATASET, BREADCRUMB],
  contextParagraphs: [
    "Paulínia é um caso atípico no Brasil: a cidade sedia refinarias da Petrobras e recebe volumes expressivos de ICMS sobre a produção de combustíveis e royalties indiretos, tornando-a uma das maiores arrecadadoras per capita do Estado de SP.",
  ],
  compositionParagraphs: [
    "As transferências do Estado de SP são dominantes — refletem a cota-parte do ICMS sobre combustíveis produzidos na cidade (refinaria Replan/Petrobras).",
    "A receita patrimonial expressiva reflete os rendimentos das aplicações financeiras do município, possibilitadas pela alta disponibilidade de caixa.",
  ],
  transferInsightSuffix: " — Paulínia é muito dependente da cota-parte do ICMS (royalties do petróleo) repassada pelo Estado de SP.",
  rppsLabel: "RPPS (Paulínia Previ)",
  showIntraWhenZero: true,
  methodologyTitle: "Caso Paulínia — royalties",
  methodologyText: "Paulínia recebe uma das maiores cotas per capita de ICMS combustíveis do Estado de SP. A refinaria Replan da Petrobras é a maior do país em capacidade e gera enorme base tributária, fazendo de Paulínia um outlier em receita por habitante.",
  navLinks: [
    { href: "/paulinia", label: "← Paulínia" },
    { href: "/paulinia/executivo", label: "Orçamento total" },
    { href: "/paulinia/saude-fiscal", label: "Saúde fiscal" },
    { href: "/paulinia/transferencias", label: "Transferências" },
  ],
} satisfies ReceitaMunicipalPageConfig

export const metadata: Metadata = {
  title: "Receita Municipal de Paulínia",
  description:
    "De onde vêm os recursos de Paulínia: impostos próprios, ICMS/IPVA estaduais, royalties e transferências federais. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01.",
  alternates: { canonical: `${SITE_URL}/paulinia/receita` },
}

export default function PauliniaReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  return <ReceitaMunicipalPage searchParams={searchParams} config={CONFIG} />
}
