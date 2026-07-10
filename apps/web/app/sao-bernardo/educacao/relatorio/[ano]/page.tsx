import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbSchema, SITE_URL } from "@/lib/structured-data"

export const dynamicParams = false

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

interface SiopeAno {
  ano: number
  despesaMde: number | null
  percentualAplicado: number | null
  limiteConstitucionalPct: number | null
  situacao: string
}

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
  h2:    { fontSize: "24px", lineHeight: "32px", color: "var(--text-01)", fontWeight: 300 } as React.CSSProperties,
  h3:    { fontSize: "15px", lineHeight: "22px", color: "var(--text-01)", fontWeight: 600 } as React.CSSProperties,
  body:  { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  small: { fontSize: "12px", lineHeight: "18px", color: "var(--text-04)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function parseNum(s: string): number | null {
  const t = (s ?? "").trim()
  if (!t) return null
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

function loadSiopeAno(ano: number): SiopeAno | null {
  const filePath = path.join(DATA_ROOT, "sao_bernardo", "educacao", "saida", `siope_sao_bernardo_${ano}.csv`)
  if (!fs.existsSync(filePath)) return null

  const lines = fs.readFileSync(filePath, "utf-8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)
  const iDespesa  = idx("despesa_mde")
  const iPct      = idx("percentual_aplicado")
  const iLimite   = idx("limite_constitucional_pct")
  const iSituacao = idx("situacao")

  const f = lines[1].split(",")
  return {
    ano,
    despesaMde: parseNum(f[iDespesa] ?? ""),
    percentualAplicado: parseNum(f[iPct] ?? ""),
    limiteConstitucionalPct: parseNum(f[iLimite] ?? ""),
    situacao: (f[iSituacao] ?? "").trim(),
  }
}

function getAnosComDado(): SiopeAno[] {
  return ANOS
    .map(loadSiopeAno)
    .filter((r): r is SiopeAno => r !== null && r.situacao !== "nao_coletado" && r.despesaMde !== null)
    .sort((a, b) => a.ano - b.ano)
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function situacaoLabel(situacao: string): string {
  if (situacao === "cumprido") return "Cumprido"
  if (situacao === "nao_cumprido") return "Não cumprido"
  return "Não coletado"
}

function situacaoColor(situacao: string): string {
  if (situacao === "cumprido") return "#42be65"
  if (situacao === "nao_cumprido") return "#fa4d56"
  return "var(--text-04)"
}

export async function generateStaticParams() {
  const anosComDado = getAnosComDado()
  return anosComDado.map((row) => ({ ano: String(row.ano) }))
}

export async function generateMetadata({ params }: { params: Promise<{ ano: string }> }): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `MDE educação — ${ano} | São Bernardo do Campo`,
    description: `Indicador de Manutenção e Desenvolvimento do Ensino (MDE) de São Bernardo do Campo em ${ano}: percentual aplicado, limite constitucional e situação de cumprimento. Fonte: SIOPE/FNDE.`,
    alternates: { canonical: `${SITE_URL}/sao-bernardo/educacao/relatorio/${ano}` },
  }
}

export default async function RelatorioEducacaoSaoBernardoPage({ params }: PageProps) {
  const { ano } = await params
  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)

  const anosComDado = getAnosComDado()
  const row = anosComDado.find((r) => r.ano === year)
  if (!row) notFound()

  const prevRow = anosComDado.filter((r) => r.ano < year).sort((a, b) => b.ano - a.ano)[0] ?? null
  const delta = prevRow && prevRow.percentualAplicado !== null && row.percentualAplicado !== null
    ? row.percentualAplicado - prevRow.percentualAplicado
    : null

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "São Bernardo do Campo", item: `${SITE_URL}/sao-bernardo` },
        { "@type": "ListItem", position: 3, name: "Educação", item: `${SITE_URL}/sao-bernardo/educacao` },
        { "@type": "ListItem", position: 4, name: "Série histórica", item: `${SITE_URL}/sao-bernardo/educacao/comparativo` },
        { "@type": "ListItem", position: 5, name: String(year) },
      ],
    },
    breadcrumbSchema([
      { name: "Início", url: SITE_URL },
      { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
      { name: "Educação", url: `${SITE_URL}/sao-bernardo/educacao` },
      { name: "Série histórica", url: `${SITE_URL}/sao-bernardo/educacao/comparativo` },
      { name: String(year) },
    ]),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sao-bernardo/educacao" className="nav-link" style={{ fontSize: "12px" }}>Educação</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sao-bernardo/educacao/comparativo" className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* Header */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>São Bernardo do Campo / SP · Educação · MDE</p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Mínimo constitucional de educação — {year}
                </h1>
              </div>
              <div className="mobile-scroll flex items-center gap-3">
                {anosComDado.map((r) => (
                  <Link key={r.ano} href={`/sao-bernardo/educacao/relatorio/${r.ano}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:   r.ano === year ? "var(--text-01)" : "var(--text-04)",
                    border:  `1px solid ${r.ano === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                  }}>
                    {r.ano}
                  </Link>
                ))}
                <a
                  href={`/api/dados/sao_bernardo/educacao/saida/siope_sao_bernardo_${year}.csv`}
                  download
                  style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--blue-40)", textDecoration: "none", border: "1px solid var(--border-01)", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  ↓ CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p style={S.label} className="mb-1">Despesa MDE {year}</p>
                <p className="font-light mt-2" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                  {row.despesaMde !== null ? fmt(row.despesaMde) : "—"}
                </p>
                <p className="mt-1" style={S.small}>Total aplicado em manutenção e desenvolvimento do ensino</p>
              </div>
              <div>
                <p style={S.label} className="mb-1">% aplicado</p>
                <p className="font-light mt-2" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                  {row.percentualAplicado !== null ? `${row.percentualAplicado.toFixed(2)}%` : "—"}
                </p>
                <p className="mt-1" style={S.small}>Sobre a receita de impostos vinculada</p>
              </div>
              <div>
                <p style={S.label} className="mb-1">Limite constitucional</p>
                <p className="font-light mt-2" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                  {row.limiteConstitucionalPct !== null ? `${row.limiteConstitucionalPct.toFixed(0)}%` : "25%"}
                </p>
                <p className="mt-1" style={S.small}>Mínimo exigido pelo art. 212 da Constituição</p>
              </div>
              <div>
                <p style={S.label} className="mb-1">Situação</p>
                <p className="font-light mt-2" style={{ fontSize: "22px", color: situacaoColor(row.situacao), lineHeight: "1.2" }}>
                  {situacaoLabel(row.situacao)}
                </p>
                <p className="mt-1" style={S.small}>
                  {delta !== null ? `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} p.p. vs. ${prevRow!.ano}` : "Sem ano anterior comparável"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como ler este indicador</p>
            <h2 className="font-light mb-6" style={S.h2}>O que o MDE mede</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O indicador de Manutenção e Desenvolvimento do Ensino (MDE) mostra o percentual das
                  receitas de impostos do município que foi efetivamente aplicado em educação no
                  exercício de {year}. A Constituição Federal exige um mínimo de 25%.
                </p>
                <p style={S.body}>
                  Em {year}, São Bernardo do Campo aplicou{" "}
                  {row.percentualAplicado !== null ? (
                    <strong style={{ color: "var(--text-01)" }}>{row.percentualAplicado.toFixed(2)}%</strong>
                  ) : "um percentual não disponível"}
                  {row.percentualAplicado !== null && row.limiteConstitucionalPct !== null && (
                    row.percentualAplicado >= row.limiteConstitucionalPct
                      ? `, acima do mínimo de ${row.limiteConstitucionalPct.toFixed(0)}% exigido.`
                      : `, abaixo do mínimo de ${row.limiteConstitucionalPct.toFixed(0)}% exigido.`
                  )}
                </p>
              </div>
              <div className="p-6" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                <p className="font-semibold mb-4" style={S.h3}>Sobre os dados desta página</p>
                <p style={S.body}>
                  Este relatório mostra apenas o indicador consolidado de MDE — não há, para
                  São Bernardo do Campo, um detalhamento por função (ensino fundamental, educação
                  infantil etc.) disponível na fonte oficial.
                </p>
                <p className="mt-3" style={S.body}>
                  Repasses federais por programa (PDDE, PNAE, PNATE, FUNDEB) ainda não têm fonte
                  pública automatizável para este município e por isso não são exibidos aqui.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  Sistema de Informações sobre Orçamentos Públicos em Educação (SIOPE), mantido pelo
                  FNDE/MEC — declaração municipal de São Bernardo do Campo.
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Um pipeline consulta a fonte pública do SIOPE e salva o indicador anual em CSV.
                  O código e os arquivos são públicos.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a href="https://www.fnde.gov.br/siope" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    SIOPE — FNDE →
                  </a>
                  <Link href="/sao-bernardo/educacao/comparativo" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Ver série histórica completa →
                  </Link>
                  <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Como extraímos os dados →
                  </Link>
                </div>
              </div>
            </div>
            <p className="mt-6" style={S.small}>
              Município de São Bernardo do Campo — IBGE 3548708. Valores nominais em BRL.
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
