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
const ANOS_SIOPS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

interface SiopsRow {
  ano: number
  pct: number
  total: number
  receitaImpostos: number
  pctTransferenciasSus: number
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
  }
}

const SIOPS_DATASET = datasetSchema({
  name: "Aplicação em saúde (SIOPS) — São Bernardo do Campo 2015–2025",
  description: "Série histórica do percentual da receita de impostos aplicado em Ações e Serviços Públicos de Saúde (ASPS) pelo Município de São Bernardo do Campo, gasto total em saúde e cumprimento do mínimo constitucional de 15% (Art. 198 CF / LC 141/2012). Fonte: SIOPS/Ministério da Saúde. IBGE 3548708.",
  url: `${SITE_URL}/sao-bernardo/saude`,
  temporalCoverage: "2015/2025",
  spatialCoverage: "São Bernardo do Campo, SP, Brasil (IBGE 3548708)",
  keywords: ["SIOPS", "saúde pública", "São Bernardo do Campo", "ASPS", "mínimo constitucional", "gasto em saúde"],
  dateModified: "2026-07-09",
  downloadUrls: ANOS_SIOPS.map(
    (ano) => `${SITE_URL}/api/dados/sao_bernardo/saude/saida/siops_sao_bernardo_${ano}.csv`
  ),
})

const SBC_SAUDE_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: SITE_URL },
  { name: "São Bernardo do Campo", url: `${SITE_URL}/sao-bernardo` },
  { name: "Saúde" },
])

export const metadata: Metadata = {
  title: "Saúde em São Bernardo do Campo — SIOPS",
  description:
    "Gasto municipal em saúde de São Bernardo do Campo. Série histórica 2015–2025: percentual da receita de impostos aplicado em ASPS, gasto total e cumprimento do mínimo constitucional de 15%. Fonte: SIOPS/Ministério da Saúde.",
  alternates: { canonical: `${SITE_URL}/sao-bernardo/saude` },
}

export default function SaoBernardoSaudePage() {
  const serie: SiopsRow[] = ANOS_SIOPS
    .map(loadSiops)
    .filter((r): r is SiopsRow => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const anoAtual = serie[0]?.ano ?? 2025
  const atual = serie[0]

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: 0,
    liquidado: s.total,
  }))

  const anosCumpridos = serie.filter((s) => s.pct >= 15).length

  const s2015 = serie.find((s) => s.ano === 2015)
  const growth = s2015 && s2015.total > 0 && atual
    ? ((atual.total - s2015.total) / s2015.total * 100) : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, São Bernardo do Campo aplicou ${atual.pct.toFixed(1)}% da receita de impostos em saúde — ${atual.pct >= 15 ? "acima" : "abaixo"} do mínimo constitucional de 15% (ASPS, Art. 198 CF / LC 141/2012), com gasto total de ${fmt(atual.total)}.`,
    ] : []),
    ...(growth !== null && s2015 ? [
      `Entre 2015 e ${anoAtual}, o gasto total em saúde variou +${growth.toFixed(0)}% em termos nominais — de ${fmt(s2015.total)} para ${fmt(atual!.total)}.`,
    ] : []),
    `São Bernardo do Campo cumpriu o mínimo constitucional de 15% em ${anosCumpridos} de ${serie.length} anos com dado disponível no SIOPS (2015–${anoAtual}).`,
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={SIOPS_DATASET} />
      <JsonLd data={SBC_SAUDE_BREADCRUMB} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Saúde · São Bernardo do Campo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2015–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Gasto municipal em saúde — São Bernardo do Campo
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, São Bernardo do Campo aplicou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.total)}</strong> em Ações e
                  Serviços Públicos de Saúde (ASPS) — {atual.pct.toFixed(1)}% da receita de impostos,{" "}
                  {atual.pct >= 15 ? "acima" : "abaixo"} do mínimo constitucional de 15%.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados declarados pelo município ao Sistema de Informações sobre Orçamentos Públicos em
                Saúde (SIOPS/Ministério da Saúde), Fase Previsto — referência oficial de conformidade
                com o Art. 198 da Constituição Federal e a LC 141/2012.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota:</strong>{" "}
                  Os indicadores de responsabilidade fiscal (LRF) do município estão em{" "}
                  <Link href="/sao-bernardo/saude-fiscal" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    Saúde Fiscal
                  </Link>. Esta página trata do gasto em saúde (SIOPS), não da LRF.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: `% Aplicado em ASPS ${anoAtual}`, valor: `${atual.pct.toFixed(1)}%`, nota: `Mínimo constitucional: 15% — ${atual.pct >= 15 ? "✓ cumprido" : "⚠ abaixo do mínimo"}` },
                  { label: "Gasto total em saúde",           valor: fmt(atual.total), nota: "ASPS — Ações e Serviços Públicos de Saúde" },
                  { label: "Receita de impostos",            valor: fmt(atual.receitaImpostos), nota: "Base de cálculo do percentual constitucional" },
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
                  <p className="uppercase font-semibold" style={S.label}>SIOPS 2015–{anoAtual}</p>
                  <Link href="/sao-bernardo/saude/comparativo" style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap" }}>
                    Ver série histórica →
                  </Link>
                </div>
                <h2 style={S.h2}>Aplicação em saúde por ano</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--teal-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>% ASPS</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.pct >= 15 ? "#24a148" : "#da1e28", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.pct.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p style={S.caption}>Gasto saúde</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.total)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Situação</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.pct >= 15 ? "#24a148" : "#da1e28", fontVariantNumeric: "tabular-nums" }}>
                          {r.pct >= 15 ? "✓ cumprido" : "⚠ abaixo"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Gasto total em ASPS por ano</p>
                <SerieHistorica data={serieChartData} unit="mi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>SIOPS por ano</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Série histórica da conformidade constitucional com o mínimo de aplicação em saúde
              (ASPS), declarada pelo Município de São Bernardo do Campo ao SIOPS.
            </p>
            <div className="flex flex-wrap gap-3">
              {ANOS_SIOPS.slice().sort((a, b) => b - a).map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_bernardo/saude/saida/siops_sao_bernardo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: Sistema de Informações sobre Orçamentos Públicos em Saúde (SIOPS/MS). Valores nominais em BRL. Município 3548708 (São Bernardo do Campo/SP).
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>O mínimo constitucional de saúde</p>
                <p style={S.body}>
                  A Constituição Federal (Art. 198, §2º) e a LC 141/2012 exigem que municípios apliquem
                  no mínimo 15% da receita de impostos e transferências constitucionais em Ações e
                  Serviços Públicos de Saúde (ASPS). O indicador é apurado e declarado pelo próprio
                  ente ao SIOPS.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  São Bernardo do Campo tem série completa no SIOPS de 2015 a {anoAtual}, com
                  cumprimento do mínimo constitucional em todos os anos disponíveis.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fontes dos dados</p>
                <p style={S.body}>
                  SIOPS: Sistema de Informações sobre Orçamentos Públicos em Saúde, mantido pelo
                  Ministério da Saúde — declarações municipais, Fase Previsto. Município de São Bernardo
                  do Campo: código IBGE 3548708.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Sem quebra por subfunção:</strong>{" "}
                  O SIOPS de São Bernardo do Campo é agregado — não detalha o gasto entre atenção
                  básica, assistência hospitalar, vigilância sanitária ou demais funções de saúde.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-bernardo" className="nav-link">← São Bernardo do Campo</Link>
            <Link href="/sao-bernardo/saude/comparativo" className="nav-link">Série histórica SIOPS</Link>
            <Link href="/sao-bernardo/saude-fiscal" className="nav-link">Saúde fiscal (LRF)</Link>
            <Link href="/sao-bernardo/educacao" className="nav-link">Educação</Link>
            <Link href="/sao-bernardo/receita" className="nav-link">Receitas</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
