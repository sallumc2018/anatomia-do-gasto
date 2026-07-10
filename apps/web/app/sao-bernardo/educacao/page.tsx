import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { JsonLd } from "@/components/seo/json-ld"
import { datasetSchema, breadcrumbSchema, SITE_URL } from "@/lib/structured-data"

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS_SIOPE = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

interface SiopeRow {
  ano: number
  despesaMde: number
  percentualAplicado: number
  limiteConstitucionalPct: number
  situacao: string
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseBR(s: string): number {
  if (!s) return 0
  const c = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(c) || 0
}

function loadSiope(ano: number): SiopeRow | null {
  const f = path.join(DATA_ROOT, "sao_bernardo", "educacao", "saida", `siope_sao_bernardo_${ano}.csv`)
  if (!fs.existsSync(f)) return null
  const lines = fs.readFileSync(f, "utf-8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null
  const h = lines[0].split(",").map((s) => s.trim().toLowerCase())
  const vals = lines[1].split(",")
  const get = (k: string) => vals[h.indexOf(k)]?.trim() ?? ""
  const sit = get("situacao")
  const despesa = get("despesa_mde")
  if (!sit || sit === "nao_coletado" || !despesa) return null
  return {
    ano,
    despesaMde:              parseBR(despesa),
    percentualAplicado:      parseFloat(get("percentual_aplicado")) || 0,
    limiteConstitucionalPct: parseFloat(get("limite_constitucional_pct")) || 25,
    situacao:                sit,
  }
}

const SIOPE_DATASET = datasetSchema({
  name: "Mínimo de Desenvolvimento do Ensino (MDE/SIOPE) — São Bernardo do Campo 2015–2025",
  description: "Série histórica do percentual de receitas de impostos aplicado em Manutenção e Desenvolvimento do Ensino (MDE) pelo Município de São Bernardo do Campo, despesa MDE e cumprimento do mínimo constitucional de 25% (Art. 212 CF). Fonte: SIOPE/FNDE. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/educacao`,
  temporalCoverage: "2015/2025",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["SIOPE", "educação", "São Bernardo do Campo", "MDE", "mínimo constitucional", "FUNDEB"],
  dateModified: "2026-07-09",
  downloadUrls: ANOS_SIOPE.map(
    (ano) => `${SITE_URL}/api/dados/sao_bernardo/educacao/saida/siope_sao_bernardo_${ano}.csv`
  ),
})

const SBC_EDUC_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: SITE_URL },
  { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
  { name: "Educação" },
])

export const metadata: Metadata = {
  title: "Educação em São Bernardo do Campo — SIOPE",
  description:
    "Gasto municipal em educação de São Bernardo do Campo. Série histórica 2015–2025: percentual da receita de impostos aplicado em MDE, despesa total e cumprimento do mínimo constitucional de 25%. Fonte: SIOPE/FNDE.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/educacao` },
}

export default function SaoBernardoEducacaoPage() {
  const serie: SiopeRow[] = ANOS_SIOPE
    .map(loadSiope)
    .filter((r): r is SiopeRow => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const anoAtual = serie[0]?.ano ?? 2025
  const atual = serie[0]

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: 0,
    liquidado: s.despesaMde,
  }))

  const anosCumpridos = serie.filter((s) => s.percentualAplicado >= 25).length

  const s2015 = serie.find((s) => s.ano === 2015)
  const growth = s2015 && s2015.despesaMde > 0 && atual
    ? ((atual.despesaMde - s2015.despesaMde) / s2015.despesaMde * 100) : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, São Bernardo do Campo aplicou ${atual.percentualAplicado.toFixed(2)}% da receita de impostos em Manutenção e Desenvolvimento do Ensino (MDE) — ${atual.percentualAplicado >= 25 ? "acima" : "abaixo"} do mínimo constitucional de 25% (Art. 212 CF), com despesa MDE de ${fmt(atual.despesaMde)}.`,
    ] : []),
    ...(growth !== null && s2015 ? [
      `Entre 2015 e ${anoAtual}, a despesa MDE variou +${growth.toFixed(0)}% em termos nominais — de ${fmt(s2015.despesaMde)} para ${fmt(atual!.despesaMde)}.`,
    ] : []),
    `São Bernardo do Campo cumpriu o mínimo constitucional de 25% em ${anosCumpridos} de ${serie.length} anos com dado disponível no SIOPE (2015–${anoAtual}).`,
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={SIOPE_DATASET} />
      <JsonLd data={SBC_EDUC_BREADCRUMB} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--green-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Educação · São Bernardo do Campo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2015–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Gasto municipal em educação — São Bernardo do Campo
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, São Bernardo do Campo aplicou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.despesaMde)}</strong> em
                  Manutenção e Desenvolvimento do Ensino (MDE) — {atual.percentualAplicado.toFixed(2)}%
                  da receita de impostos vinculada, {atual.percentualAplicado >= 25 ? "acima" : "abaixo"} do
                  mínimo constitucional de 25%.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados declarados pelo município ao Sistema de Informações sobre Orçamentos Públicos em
                Educação (SIOPE/FNDE) — referência oficial de conformidade com o Art. 212 da Constituição
                Federal.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: `% Aplicado em MDE ${anoAtual}`, valor: `${atual.percentualAplicado.toFixed(2)}%`, nota: `Mínimo constitucional: 25% — ${atual.percentualAplicado >= 25 ? "✓ cumprido" : "⚠ abaixo do mínimo"}` },
                  { label: "Despesa MDE",                     valor: fmt(atual.despesaMde), nota: "Manutenção e Desenvolvimento do Ensino" },
                  { label: "Variação 2015–" + anoAtual,       valor: growth !== null ? `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%` : "—", nota: "Variação nominal da despesa MDE" },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Série histórica */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <p className="uppercase font-semibold" style={S.label}>SIOPE 2015–{anoAtual}</p>
                  <Link href="/sao-bernardo/educacao/comparativo" style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap" }}>
                    Ver série histórica →
                  </Link>
                </div>
                <h2 style={S.h2}>Aplicação em educação por ano</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--green-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>% MDE</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.percentualAplicado >= 25 ? "#24a148" : "#da1e28", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.percentualAplicado.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p style={S.caption}>Despesa MDE</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.despesaMde)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Situação</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.percentualAplicado >= 25 ? "#24a148" : "#da1e28", fontVariantNumeric: "tabular-nums" }}>
                          {r.percentualAplicado >= 25 ? "✓ cumprido" : "⚠ abaixo"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Despesa MDE por ano (R$)</p>
                <SerieHistorica data={serieChartData} unit="mi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>SIOPE por ano</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Série histórica da conformidade constitucional com o mínimo de aplicação em educação
              (MDE), declarada pelo Município de São Bernardo do Campo ao SIOPE.
            </p>
            <div className="flex flex-wrap gap-3">
              {ANOS_SIOPE.slice().sort((a, b) => b - a).map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_bernardo/educacao/saida/siope_sao_bernardo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: Sistema de Informações sobre Orçamentos Públicos em Educação (SIOPE/FNDE). Valores nominais em BRL. Município 3548708 (São Bernardo do Campo/SP).
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>O mínimo constitucional de educação</p>
                <p style={S.body}>
                  A Constituição Federal (Art. 212) exige que municípios apliquem no mínimo 25% das
                  receitas resultantes de impostos, incluindo transferências, na manutenção e
                  desenvolvimento do ensino (MDE). O indicador é apurado e declarado pelo próprio
                  ente ao SIOPE.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  São Bernardo do Campo tem série completa no SIOPE de 2015 a {anoAtual}, com
                  cumprimento do mínimo constitucional em todos os anos disponíveis.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fontes dos dados</p>
                <p style={S.body}>
                  SIOPE: Sistema de Informações sobre Orçamentos Públicos em Educação, mantido pelo
                  FNDE/MEC — declarações municipais. Município de São Bernardo do Campo: código IBGE
                  3548708.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Sem quebra por subfunção:</strong>{" "}
                  O SIOPE de São Bernardo do Campo é agregado — não detalha o gasto entre creche,
                  pré-escola, ensino fundamental ou demais etapas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-bernardo" className="nav-link">← São Bernardo do Campo</Link>
            <Link href="/sao-bernardo/educacao/comparativo" className="nav-link">Série histórica SIOPE</Link>
            <Link href="/sao-bernardo/saude" className="nav-link">Saúde</Link>
            <Link href="/sao-bernardo/receita" className="nav-link">Receitas</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
