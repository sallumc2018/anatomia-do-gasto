import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { SITE_URL } from "@/lib/structured-data"

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS_SIOPS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

export const dynamicParams = false

interface PageProps {
  params: Promise<{ ano: string }>
}

interface SiopsRow {
  ano: number
  pct: number
  total: number
  receitaImpostos: number
  pctTransferenciasSus: number
  situacao: string
  fase: string
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
  h2:    { fontSize: "24px", lineHeight: "32px", color: "var(--text-01)", fontWeight: 300 } as React.CSSProperties,
  h3:    { fontSize: "15px", lineHeight: "22px", color: "var(--text-01)", fontWeight: 600 } as React.CSSProperties,
  body:  { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  small: { fontSize: "12px", lineHeight: "18px", color: "var(--text-04)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

function parseBR(s: string): number {
  if (!s) return 0
  const c = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(c) || 0
}

function loadSiops(ano: number): SiopsRow | null {
  const f = path.join(DATA_ROOT, "sao_bernardo", "saude", "saida", `siops_sao_bernardo_${ano}.csv`)
  if (!fs.existsSync(f)) return null
  const lines = fs.readFileSync(f, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const h = lines[0].split(",").map((s) => s.trim().toLowerCase())
  const vals = lines[1].split(",")
  const get = (k: string) => vals[h.indexOf(k)]?.trim() ?? ""
  const sit = get("situacao")
  if (!sit || sit === "nao_coletado") return null
  return {
    ano,
    pct:                  parseFloat(get("percentual_asps")) || 0,
    total:                parseBR(get("despesa_saude_total")),
    receitaImpostos:      parseBR(get("receita_impostos")),
    pctTransferenciasSus: parseFloat(get("pct_transferencias_sus")) || 0,
    situacao:             sit,
    fase:                 get("fase"),
  }
}

function getAvailableYears(): number[] {
  return ANOS_SIOPS.filter((ano) => loadSiops(ano) !== null).sort((a, b) => a - b)
}

export async function generateStaticParams() {
  return getAvailableYears().map((ano) => ({ ano: String(ano) }))
}

export async function generateMetadata({ params }: { params: Promise<{ ano: string }> }): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Saúde — ${ano} | São Bernardo do Campo`,
    description: `Gasto municipal em saúde de São Bernardo do Campo em ${ano}: percentual da receita de impostos aplicado, gasto total e cumprimento do mínimo constitucional de 15%. Fonte: SIOPS/Ministério da Saúde.`,
    alternates: { canonical: `${SITE_URL}/sao-bernardo/saude/relatorio/${ano}` },
  }
}

export default async function RelatorioSaudeSaoBernardoPage({ params }: PageProps) {
  const { ano } = await params
  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)

  const availableYears = getAvailableYears()
  if (!availableYears.includes(year)) notFound()

  const row = loadSiops(year)
  if (!row) notFound()

  const idx = availableYears.indexOf(year)
  const prevYear = idx > 0 ? availableYears[idx - 1] : null
  const prevRow = prevYear ? loadSiops(prevYear) : null
  const deltaPct = prevRow ? row.pct - prevRow.pct : null
  const deltaTotal = prevRow && prevRow.total ? ((row.total - prevRow.total) / prevRow.total) * 100 : null

  const ok = row.pct >= 15

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Saúde", item: `${SITE_URL}/sao-bernardo/saude` },
          { "@type": "ListItem", position: 3, name: "Série histórica", item: `${SITE_URL}/sao-bernardo/saude/comparativo` },
          { "@type": "ListItem", position: 4, name: String(year) },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Gasto em saúde — São Bernardo do Campo ${year}`,
        description: `Gasto municipal em saúde de São Bernardo do Campo em ${year}: percentual da receita de impostos aplicado, gasto total e cumprimento do mínimo constitucional de 15%. Fonte: SIOPS/Ministério da Saúde.`,
        url: `${SITE_URL}/sao-bernardo/saude/relatorio/${year}`,
        temporalCoverage: String(year),
        license: "https://creativecommons.org/licenses/by/4.0/",
        publisher: { "@type": "Organization", name: "Anatomia do Gasto", url: SITE_URL },
        spatialCoverage: { "@type": "Place", name: "São Bernardo do Campo, São Paulo, Brasil" },
      }} />

      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sao-bernardo/saude" className="nav-link" style={{ fontSize: "12px" }}>Saúde</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sao-bernardo/saude/comparativo" className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* Header do relatório */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>São Bernardo do Campo / SP · Saúde</p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Gasto em saúde — {year}
                </h1>
              </div>

              {/* Navegação entre anos */}
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link
                    key={y}
                    href={`/sao-bernardo/saude/relatorio/${y}`}
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
                  href={`/api/dados/sao_bernardo/saude/saida/siops_sao_bernardo_${year}.csv`}
                  download
                  style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--blue-40)", textDecoration: "none", border: "1px solid var(--border-01)", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  ↓ CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs principais */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Indicadores SIOPS — {year}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  label: "% Aplicado em ASPS",
                  valor: fmtPct(row.pct),
                  nota: `Mínimo constitucional: 15% — ${ok ? "✓ cumprido" : "⚠ abaixo do mínimo"}`,
                  destaque: !ok,
                },
                {
                  label: "Gasto total em saúde",
                  valor: fmt(row.total),
                  nota: "ASPS — Ações e Serviços Públicos de Saúde",
                  destaque: false,
                },
                {
                  label: "Receita de impostos",
                  valor: fmt(row.receitaImpostos),
                  nota: "Base de cálculo do percentual constitucional",
                  destaque: false,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "24px", color: item.destaque ? "#da1e28" : "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {item.valor}
                  </p>
                  <p className="mt-1" style={S.caption}>{item.nota}</p>
                </div>
              ))}
            </div>

            {prevRow && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ ...S.borderTop, paddingTop: "24px" }}>
                <div>
                  <p style={S.caption}>Variação do % ASPS vs. {prevYear}</p>
                  <p className="font-mono mt-1" style={{ fontSize: "16px", color: deltaPct !== null && deltaPct < 0 ? "#fa4d56" : "var(--text-02)" }}>
                    {deltaPct === null ? "—" : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)} p.p.`}
                  </p>
                </div>
                <div>
                  <p style={S.caption}>Variação do gasto total vs. {prevYear}</p>
                  <p className="font-mono mt-1" style={{ fontSize: "16px", color: deltaTotal !== null && deltaTotal < 0 ? "#fa4d56" : "var(--text-02)" }}>
                    {deltaTotal === null ? "—" : `${deltaTotal >= 0 ? "+" : ""}${fmtPct(deltaTotal)}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Detalhamento SIOPS */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Detalhamento</p>
            <h2 className="font-light mb-8" style={S.h2}>Todos os campos declarados no SIOPS · {year}</h2>
            <div style={S.borderTop}>
              {[
                { termo: "Percentual ASPS", valor: fmtPct(row.pct) },
                { termo: "Gasto total em saúde", valor: fmt(row.total) },
                { termo: "Receita de impostos (base de cálculo)", valor: fmt(row.receitaImpostos) },
                { termo: "% de transferências do SUS no gasto", valor: fmtPct(row.pctTransferenciasSus) },
                { termo: "Limite constitucional mínimo", valor: "15%" },
                { termo: "Situação de cumprimento", valor: row.situacao === "cumprido" ? "Cumprido" : "Abaixo do mínimo" },
                { termo: "Fase da declaração SIOPS", valor: row.fase === "previsto" ? "Previsto (declaração municipal)" : row.fase || "—" },
              ].map((item) => (
                <div key={item.termo} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3" style={S.borderBottom}>
                  <p style={S.body}>{item.termo}</p>
                  <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                    {item.valor}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-5" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Anomalia nos dados de origem:</strong> o campo
                &ldquo;gasto por habitante&rdquo; declarado no SIOPS para São Bernardo do Campo em {year}{" "}
                retorna um valor agregado incompatível com a definição de per capita — maior que a
                própria despesa total em saúde. Por isso, esse campo não é exibido neste relatório.
              </p>
            </div>
          </div>
        </section>

        {/* O que estes dados não mostram */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
            <h2 className="font-light mb-6" style={S.h2}>Sem quebra por função de saúde</h2>
            <p style={{ ...S.body, maxWidth: "720px" }}>
              O SIOPS de São Bernardo do Campo é agregado — não detalha o gasto entre atenção básica,
              assistência hospitalar, vigilância sanitária/epidemiológica ou outras funções, como
              acontece nos relatórios de aplicação da LRF de Sorocaba. Também não identifica fornecedor,
              contrato, unidade de saúde ou número de atendimentos.
            </p>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  Sistema de Informações sobre Orçamentos Públicos em Saúde (SIOPS), Ministério da Saúde —
                  declaração municipal de São Bernardo do Campo, Fase Previsto, ano {year}.
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Os dados são consultados na API pública do SIOPS e salvos em CSV, um arquivo por ano.
                  Não há PDF municipal envolvido nesta série — a fonte é o próprio SICONFI/SIOPS.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a href="https://siops.saude.gov.br/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    SIOPS — Ministério da Saúde →
                  </a>
                  <Link href="/sao-bernardo/saude/comparativo" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Ver série histórica completa →
                  </Link>
                  <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Como tratamos os dados →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
