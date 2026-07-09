import type { Metadata } from "next"
import {
  ReceitaMunicipalPage,
  type ReceitaMunicipalPageConfig,
} from "@/components/municipios/receita-municipal-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Receitas municipais — São Bernardo do Campo 2020–2024",
  description: "Receitas do Município de São Bernardo do Campo: impostos próprios, cota-parte ICMS/IPVA, FPM e transferências federais. Fonte: RREO Anexo 01/SICONFI. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/receita`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["receita municipal", "ICMS", "FPM", "São Bernardo do Campo", "ABC Paulista", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) => `${SITE_URL}/api/dados/sao_bernardo/receita/saida/receitas_sao_bernardo_${ano}.csv`,
  ),
})

const BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: SITE_URL },
  { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
  { name: "Receitas municipais" },
])

const CONFIG = {
  dataMunicipio: "sao_bernardo",
  slug: "sao-bernardo",
  nome: "São Bernardo do Campo",
  ibge: "3548708",
  structuredData: [DATASET, BREADCRUMB],
  rppsLabel: "RPPS",
  methodologyTitle: "São Bernardo do Campo",
  methodologyText: "SBC é o maior município do ABC Paulista e um dos maiores centros industriais do Brasil. Sede de montadoras como Scania e Mercedes-Benz, tem base tributária fortemente ligada ao setor industrial, o que reflete na composição das receitas.",
  navLinks: [
    { href: "/sao-bernardo", label: "← São Bernardo" },
    { href: "/sao-bernardo/saude-fiscal", label: "Saúde fiscal" },
    { href: "/sao-bernardo/seguranca", label: "Segurança" },
    { href: "/sao-bernardo/transporte", label: "Transporte" },
  ],
} satisfies ReceitaMunicipalPageConfig

export const metadata: Metadata = {
  title: "Receita Municipal de São Bernardo do Campo",
  description:
    "De onde vêm os recursos de São Bernardo do Campo: impostos próprios, ICMS/IPVA estaduais e transferências federais. Série histórica 2015–2025. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/receita` },
}

export default function SaoBernardoReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  return <ReceitaMunicipalPage searchParams={searchParams} config={CONFIG} />
}
