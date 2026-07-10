import type { Metadata } from "next"
import { TransportePage, type TransportePageConfig } from "@/components/municipios/transporte-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
const DATASET = datasetSchema({
  name: "Despesas em transporte — São Paulo 2020–2025",
  description: "Execução orçamentária em transporte (função 26) do Município de São Paulo: RREO e DCA/SICONFI por ano. Inclui ônibus, metrô, BRT e infraestrutura viária. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/transporte`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["transporte", "mobilidade urbana", "ônibus", "metrô", "RREO", "São Paulo"],
  dateModified: "2026-06-20",
  downloadUrls: [
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sao_paulo/transporte/saida/rreo_transporte_sao_paulo_${ano}.csv`),
    ...YEARS.map((ano) => `${SITE_URL}/api/dados/sao_paulo/transporte/saida/dca_transporte_sao_paulo_${ano}.csv`),
  ],
})

const CONFIG = {
  dataMunicipio: "sao_paulo",
  nome: "São Paulo",
  ibge: "3550308",
  structuredData: [DATASET, breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
    { name: "Transporte" },
  ])],
  variant: "dca",
  navLinks: [
    { href: "/sao-paulo", label: "← São Paulo" },
    { href: "/sao-paulo/transporte/comparativo", label: "Comparativo histórico" },
    { href: "/sao-paulo/executivo", label: "Orçamento total" },
    { href: "/sao-paulo/seguranca", label: "Segurança pública" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies TransportePageConfig

export const metadata: Metadata = {
  title: "Função Transporte em São Paulo",
  description: "Execução orçamentária da função transporte em São Paulo 2020–2025: liquidado, pago e fontes RREO+DCA/SICONFI por ano.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/transporte` },
}

export default function SaoPauloTransportePage() {
  return <TransportePage config={CONFIG} />
}
