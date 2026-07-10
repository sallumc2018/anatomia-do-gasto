import type { Metadata } from "next"

import {
  SegurancaPage,
  type SegurancaPageConfig,
} from "@/components/municipios/seguranca-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025]
const DATASET = datasetSchema({
  name: "Despesas em segurança pública — São Paulo 2020–2025",
  description: "Execução orçamentária em segurança pública (função 06) do Município de São Paulo: dotação atualizada, liquidado e pago por ano e quadrimestre. Inclui dados RREO e despesas por categoria econômica. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/seguranca`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["segurança pública", "despesas São Paulo", "RREO", "orçamento municipal", "guarda civil", "São Paulo"],
  dateModified: "2026-06-20",
  downloadUrls: [
    ...YEARS.map(
      (ano) =>
        `${SITE_URL}/api/dados/sao_paulo/seguranca/saida/despesas_seguranca_sao_paulo_${ano}.csv`,
    ),
    ...YEARS.map(
      (ano) =>
        `${SITE_URL}/api/dados/sao_paulo/seguranca/saida/rreo_seguranca_sao_paulo_${ano}.csv`,
    ),
  ],
})

const CONFIG = {
  dataMunicipio: "sao_paulo",
  nome: "São Paulo",
  ibge: "3550308",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
      { name: "Segurança pública" },
    ]),
  ],
  yearsSource: "seguranca",
  variant: "totais",
  navLinks: [
    { href: "/sao-paulo", label: "← São Paulo" },
    { href: "/sao-paulo/seguranca/comparativo", label: "Série histórica" },
    { href: "/sao-paulo/executivo", label: "Orçamento total" },
    { href: "/sao-paulo/transporte", label: "Transporte" },
    { href: "/metodologia", label: "Metodologia" },
  ],
} satisfies SegurancaPageConfig

export const metadata: Metadata = {
  title: "Segurança Pública em São Paulo",
  description: "Execução orçamentária de segurança pública em São Paulo 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/seguranca` },
}

export default function SaoPauloSegurancaPage() {
  return <SegurancaPage config={CONFIG} />
}
