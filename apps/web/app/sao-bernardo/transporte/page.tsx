import type { Metadata } from "next"
import { TransportePage, type TransportePageConfig } from "@/components/municipios/transporte-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Despesas em transporte — São Bernardo do Campo 2020–2024",
  description: "Execução orçamentária em transporte (função 26) do Município de São Bernardo do Campo. Fonte: RREO/SICONFI. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/transporte`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["transporte", "mobilidade", "São Bernardo do Campo", "ABC Paulista", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map((ano) => `${SITE_URL}/api/dados/sao_bernardo/transporte/saida/rreo_transporte_sao_bernardo_${ano}.csv`),
})

const CONFIG = {
  dataMunicipio: "sao_bernardo",
  nome: "São Bernardo do Campo",
  ibge: "3548708",
  structuredData: [DATASET, breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
    { name: "Transporte" },
  ])],
  variant: "rreo",
  downloadMunicipio: "sao_bernardo",
  contextText: "São Bernardo é um município de grandes distâncias e histórico industrial, com demanda expressiva de transporte público e rodovias municipais.",
  navLinks: [
    { href: "/sao-bernardo", label: "← São Bernardo" },
    { href: "/sao-bernardo/seguranca", label: "Segurança" },
    { href: "/sao-bernardo/receita", label: "Receitas" },
    { href: "/sao-bernardo/saude-fiscal", label: "Saúde fiscal" },
  ],
} satisfies TransportePageConfig

export const metadata: Metadata = {
  title: "Transporte em São Bernardo do Campo",
  description: "Execução orçamentária de transporte em São Bernardo do Campo 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/transporte` },
}

export default function SaoBernardoTransportePage() {
  return <TransportePage config={CONFIG} />
}
