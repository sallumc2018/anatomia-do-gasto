import type { Metadata } from "next"

import {
  SegurancaPage,
  type SegurancaPageConfig,
} from "@/components/municipios/seguranca-page"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

const DATASET = datasetSchema({
  name: "Despesas em segurança pública — São Bernardo do Campo 2020–2024",
  description: "Execução orçamentária em segurança pública (função 06) do Município de São Bernardo do Campo: dotação, liquidado. Fonte: RREO/SICONFI. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/seguranca`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["segurança pública", "São Bernardo do Campo", "ABC Paulista", "orçamento", "SICONFI"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024].map(
    (ano) =>
      `${SITE_URL}/api/dados/sao_bernardo/seguranca/saida/rreo_seguranca_sao_bernardo_${ano}.csv`,
  ),
})

const CONFIG = {
  dataMunicipio: "sao_bernardo",
  nome: "São Bernardo do Campo",
  ibge: "3548708",
  structuredData: [
    DATASET,
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
      { name: "Segurança pública" },
    ]),
  ],
  yearsSource: "seguranca",
  variant: "detalhada",
  downloadMunicipio: "sao_bernardo",
  navLinks: [
    { href: "/sao-bernardo", label: "← São Bernardo" },
    { href: "/sao-bernardo/transporte", label: "Transporte" },
    { href: "/sao-bernardo/receita", label: "Receitas" },
    { href: "/sao-bernardo/saude-fiscal", label: "Saúde fiscal" },
  ],
} satisfies SegurancaPageConfig

export const metadata: Metadata = {
  title: "Segurança Pública em São Bernardo do Campo",
  description: "Execução orçamentária de segurança pública em São Bernardo do Campo 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/seguranca` },
}

export default function SaoBernardoSegurancaPage() {
  return <SegurancaPage config={CONFIG} />
}
