import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRREODespesas,
  loadRREOReceitas,
  TOTAL_ROW,
  type HealthArea,
} from "@/lib/data"
import { QuadriSelector } from "@/components/relatorio/QuadriSelector"

const AREA: HealthArea = "saude"

// ── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ ano: string }>
}

// ── Style constants ───────────────────────────────────────────────────────────

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

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const years = getAvailableYears(AREA)
  return years.map((year) => ({ ano: String(year) }))
}

export async function generateMetadata({ params }: { params: Promise<{ ano: string }> }): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Despesas em saúde — ${ano} | Sorocaba`,
    description: `Execução orçamentária em saúde de Sorocaba em ${ano}: dotação atualizada, empenhada, liquidada e paga por função. Fonte: Relatórios de Aplicação da LRF e RREO Anexo 12 — Prefeitura de Sorocaba/SP.`,
    alternates: { canonical: `https://www.anatomiadogasto.ong.br/sorocaba/saude/relatorio/${ano}` },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RelatorioSaudePage({ params }: PageProps) {
  const { ano } = await params

  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)
  const availableYears = getAvailableYears(AREA)

  if (!availableYears.includes(year)) notFound()

  const allData    = loadYearData(year, AREA)
  const quads      = [...new Set(allData.map((r) => r.quadrimestre))].sort()
  const defaultQuad = quads[quads.length - 1]

  const prevYear   = availableYears.find((y) => y < year) ?? null
  const prevAllData = prevYear ? loadYearData(prevYear, AREA) : []

  const rreoAll    = loadRREODespesas(year)
  const rreoRecAll = loadRREOReceitas(year)

  return (
    <div className="min-h-screen flex flex-col">

      <ShellHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://www.anatomiadogasto.ong.br/" },
          { "@type": "ListItem", position: 2, name: "Saúde", item: "https://www.anatomiadogasto.ong.br/sorocaba/saude" },
          { "@type": "ListItem", position: 3, name: "Série histórica", item: "https://www.anatomiadogasto.ong.br/sorocaba/saude/comparativo" },
          { "@type": "ListItem", position: 4, name: String(year) },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Execução orçamentária em saúde — Sorocaba ${year}`,
        description: `Execução orçamentária em saúde de Sorocaba em ${year}: dotação atualizada, empenhada, liquidada e paga por função. Fonte: Relatórios de Aplicação da LRF e RREO Anexo 12 — Prefeitura de Sorocaba/SP.`,
        url: `https://www.anatomiadogasto.ong.br/sorocaba/saude/relatorio/${year}`,
        temporalCoverage: String(year),
        license: "https://creativecommons.org/licenses/by/4.0/",
        publisher: { "@type": "Organization", name: "Anatomia do Gasto", url: "https://www.anatomiadogasto.ong.br" },
        spatialCoverage: { "@type": "Place", name: "Sorocaba, São Paulo, Brasil" },
      }) }} />

      <main id="conteudo" className="flex-1">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>
              Início
            </Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba/saude" className="nav-link" style={{ fontSize: "12px" }}>
              Saúde
            </Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba/saude/comparativo" className="nav-link" style={{ fontSize: "12px" }}>
              Série histórica
            </Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>
              {year}
            </span>
          </div>
        </div>

        {/* ── Header do relatório ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>
                  Sorocaba / SP · Saúde
                </p>
                <h1
                  className="font-light"
                  style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}
                >
                  Despesas em saúde — {year}
                </h1>
              </div>

              {/* Navegação entre anos */}
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link
                    key={y}
                    href={`/sorocaba/saude/relatorio/${y}`}
                    style={{
                      fontSize: "13px",
                      fontFamily: "var(--font-ibm-plex-mono)",
                      color:      y === year ? "var(--text-01)" : "var(--text-04)",
                      border:     `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                      padding:    "4px 10px",
                      textDecoration: "none",
                    }}
                  >
                    {y}
                  </Link>
                ))}
                <a
                  href={`/api/dados/sorocaba/saude/saida/despesas_saude_sorocaba_${year}.csv`}
                  download
                  style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--blue-40)", textDecoration: "none", border: "1px solid var(--border-01)", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  ↓ CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Client component: tabs + conteúdo variável por quadrimestre ─── */}
        <Suspense>
          <QuadriSelector
            year={year}
            quads={quads}
            defaultQuad={defaultQuad}
            allData={allData}
            prevYear={prevYear}
            prevAllData={prevAllData}
            rreoAll={rreoAll}
            rreoRecAll={rreoRecAll}
            totalRow={TOTAL_ROW[AREA]}
          />
        </Suspense>

      </main>

      <PageFooter />

    </div>
  )
}
