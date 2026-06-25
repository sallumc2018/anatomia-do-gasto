import type { Metadata } from "next"

import {
  SegurancaPage,
  type SegurancaPageConfig,
} from "@/components/municipios/seguranca-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Despesas em segurança pública — Paulínia 2020–2024",
  description: "Execução orçamentária em segurança pública (função 06) do Município de Paulínia: dotação, liquidado. Fonte: RREO/SICONFI. IBGE 3536505.",
  url: `${SITE_URL}/paulinia/seguranca`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  keywords: ["segurança pública", "Paulínia", "orçamento", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) =>
      `${SITE_URL}/api/dados/paulinia/seguranca/saida/rreo_seguranca_paulinia_${ano}.csv`,
  ),
})

const CONFIG = {
  dataMunicipio: "paulinia",
  nome: "Paulínia",
  ibge: "3536505",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "Paulínia", url: `${SITE_URL}/paulinia` },
      { name: "Segurança pública" },
    ]),
  ],
  yearsSource: "transporte",
  variant: "totais",
  navLinks: [
    { href: "/paulinia", label: "← Paulínia" },
    { href: "/paulinia/executivo", label: "Orçamento total" },
    { href: "/paulinia/transporte", label: "Transporte" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies SegurancaPageConfig

export const metadata: Metadata = {
  title: "Segurança Pública em Paulínia",
  description: "Execução orçamentária de segurança pública em Paulínia 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: `${SITE_URL}/paulinia/seguranca` },
}

export default function PauliniaSegurancaPage() {
  return <SegurancaPage config={CONFIG} />
}
