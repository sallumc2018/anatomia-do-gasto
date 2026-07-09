import type { Metadata } from "next"
import { TransportePage, type TransportePageConfig } from "@/components/municipios/transporte-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Despesas em transporte — Paulínia 2020–2024",
  description: "Execução orçamentária em transporte (função 26) do Município de Paulínia: dotação, liquidado, pago. Fonte: DCA/SICONFI. IBGE 3536505.",
  url: `${SITE_URL}/paulinia/transporte`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  keywords: ["transporte", "mobilidade", "Paulínia", "orçamento", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map((ano) => `${SITE_URL}/api/dados/paulinia/transporte/saida/dca_transporte_paulinia_${ano}.csv`),
})

const CONFIG = {
  dataMunicipio: "paulinia",
  nome: "Paulínia",
  ibge: "3536505",
  structuredData: [DATASET, breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "Paulínia", url: `${SITE_URL}/paulinia` },
    { name: "Transporte" },
  ])],
  variant: "dca",
  navLinks: [
    { href: "/paulinia", label: "← Paulínia" },
    { href: "/paulinia/transporte/comparativo", label: "Comparativo histórico" },
    { href: "/paulinia/executivo", label: "Orçamento total" },
    { href: "/paulinia/seguranca", label: "Segurança pública" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies TransportePageConfig

export const metadata: Metadata = {
  title: "Função Transporte em Paulínia",
  description: "Execução orçamentária da função transporte em Paulínia 2020–2025: liquidado, pago e fontes RREO+DCA/SICONFI por ano.",
  alternates: { canonical: `${SITE_URL}/paulinia/transporte` },
}

export default function PauliniaTransportePage() {
  return <TransportePage config={CONFIG} />
}
