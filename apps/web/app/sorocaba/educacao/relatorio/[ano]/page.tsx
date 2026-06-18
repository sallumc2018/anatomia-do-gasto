import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRevenueData,
  type HealthArea,
} from "@/lib/data"
import { TrimestreSelector } from "@/components/relatorio/TrimestreSelector"

const AREA: HealthArea = "educacao"

interface PageProps {
  params: Promise<{ ano: string }>
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

export async function generateStaticParams() {
  const years = getAvailableYears(AREA)
  return years.map((year) => ({ ano: String(year) }))
}

export async function generateMetadata({ params }: { params: Promise<{ ano: string }> }): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Despesas em educação — ${ano} | Sorocaba`,
    description: `Execução orçamentária em educação de Sorocaba em ${ano}: dotação atualizada, empenhada, liquidada e paga por trimestre e subfunção. Fonte: Relatórios de Aplicação da LRF — Prefeitura de Sorocaba/SP.`,
    alternates: { canonical: `https://www.anatomiadogasto.ong.br/sorocaba/educacao/relatorio/${ano}` },
  }
}

export default async function RelatorioEducacaoPage({ params }: PageProps) {
  const { ano } = await params

  if (!/^\d{4}$/.test(ano)) notFound()
  const year           = Number(ano)
  const availableYears = getAvailableYears(AREA)

  if (!availableYears.includes(year)) notFound()

  const allData    = loadYearData(year, AREA)
  const trims      = [...new Set(allData.map((r) => r.quadrimestre))].sort()
  const defaultTrim = trims[trims.length - 1]

  const prevYear    = availableYears.find((y) => y < year) ?? null
  const prevAllData = prevYear ? loadYearData(prevYear, AREA) : []

  const revenueRows = loadRevenueData(year, AREA)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://www.anatomiadogasto.ong.br/" },
          { "@type": "ListItem", position: 2, name: "Educação", item: "https://www.anatomiadogasto.ong.br/sorocaba/educacao" },
          { "@type": "ListItem", position: 3, name: "Série histórica", item: "https://www.anatomiadogasto.ong.br/sorocaba/educacao/comparativo" },
          { "@type": "ListItem", position: 4, name: String(year) },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Execução orçamentária em educação — Sorocaba ${year}`,
        description: `Execução orçamentária em educação de Sorocaba em ${year}: dotação atualizada, empenhada, liquidada e paga por trimestre e subfunção. Fonte: Relatórios de Aplicação da LRF — Prefeitura de Sorocaba/SP.`,
        url: `https://www.anatomiadogasto.ong.br/sorocaba/educacao/relatorio/${year}`,
        temporalCoverage: String(year),
        license: "https://creativecommons.org/licenses/by/4.0/",
        publisher: { "@type": "Organization", name: "Anatomia do Gasto", url: "https://www.anatomiadogasto.ong.br" },
        spatialCoverage: { "@type": "Place", name: "Sorocaba, São Paulo, Brasil" },
      }) }} />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/"                      className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba/educacao"              className="nav-link" style={{ fontSize: "12px" }}>Educação</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba/educacao/comparativo"  className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* Header */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Sorocaba / SP · Educação</p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Despesas em educação — {year}
                </h1>
              </div>
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link key={y} href={`/sorocaba/educacao/relatorio/${y}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:   y === year ? "var(--text-01)" : "var(--text-04)",
                    border:  `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                  }}>
                    {y}
                  </Link>
                ))}
                <a
                  href={`/api/dados/sorocaba/educacao/saida/despesas_educacao_sorocaba_${year}.csv`}
                  download
                  style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--blue-40)", textDecoration: "none", border: "1px solid var(--border-01)", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  ↓ CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Client component: tabs + conteúdo variável por trimestre ───── */}
        <Suspense>
          <TrimestreSelector
            year={year}
            trims={trims}
            defaultTrim={defaultTrim}
            allData={allData}
            prevYear={prevYear}
            prevAllData={prevAllData}
            revenueRows={revenueRows}
          />
        </Suspense>

      </main>
      <PageFooter />
    </div>
  )
}
