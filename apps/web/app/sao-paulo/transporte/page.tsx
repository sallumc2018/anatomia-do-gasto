import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsTransporte,
  loadTransporteOrcamento,
  loadTransporteDca,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"

const MUNICIPIO = "sao_paulo"

export const metadata: Metadata = {
  title: "Função Transporte em São Paulo",
  description: "Execução orçamentária da função transporte em São Paulo 2020–2025: liquidado, pago e fontes RREO+DCA/SICONFI por ano.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/transporte" },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  h2: {
    fontSize: "28px",
    lineHeight: "36px",
    color: "var(--text-01)",
    fontWeight: 300,
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

export default function SaoPauloTransportePage() {
  const years = getAvailableYearsTransporte(MUNICIPIO)
  const latestYear = years[0]
  const latestOrcamento = latestYear ? loadTransporteOrcamento(latestYear, MUNICIPIO) : null
  const latestDca       = latestYear ? loadTransporteDca(latestYear, MUNICIPIO) : null

  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const taxaExecucao = latestOrcamento && latestOrcamento.dotacao_atualizada > 0
    ? (latestOrcamento.empenhado / latestOrcamento.dotacao_atualizada) * 100
    : null

  const chartYears = [...years].reverse()
  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => {
    const dca = loadTransporteDca(year, MUNICIPIO)
    return { year: String(year), total: dca?.liquidado ?? 0 }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--cyan-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Transporte · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série {yearRange}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Função Transporte em São Paulo
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                Orçamento anual da função Transporte (função 26) declarado ao Tesouro Nacional
                via SICONFI — RREO Anexo 02 e DCA Anexo I-E.
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
                <strong style={{ color: "var(--text-03)" }}>Limitação:</strong> A função 26 agrupa
                todas as subfunções de transporte — transporte público urbano, infraestrutura viária e demais.
                Não é possível isolar cada modalidade a partir desta fonte.
              </p>
            </div>
          </div>
        </section>

        {/* Métricas do ano mais recente */}
        {latestOrcamento && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p style={S.label} className="mb-6">Função 26 — Transporte · {latestYear} · RREO Anexo 02</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p style={S.label} className="mb-1">Dotação atualizada</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {formatMillions(latestOrcamento.dotacao_atualizada)}
                  </p>
                </div>
                <div>
                  <p style={S.label} className="mb-1">Empenhado</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {formatMillions(latestOrcamento.empenhado)}
                  </p>
                </div>
                <div>
                  <p style={S.label} className="mb-1">Taxa de execução</p>
                  <p className="font-light" style={{
                    fontSize: "24px",
                    color: taxaExecucao !== null && taxaExecucao > 95
                      ? "var(--yellow-60, #b45309)"
                      : "var(--text-01)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p style={S.label} className="mb-1">% do orçamento municipal</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {latestOrcamento.pct_orcamento.toFixed(2)}%
                  </p>
                </div>
              </div>
              {latestDca && (
                <p className="mt-4" style={S.caption}>
                  DCA — Pago: {formatPrecise(latestDca.pago)} · Liquidado: {formatPrecise(latestDca.liquidado)}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Gráfico histórico */}
        {totalAnualData.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <h2 className="font-light mb-2" style={S.h2}>Evolução do gasto liquidado</h2>
              <p className="mb-6" style={S.caption}>Função 26 — Transporte · DCA Anexo I-E · São Paulo/SP</p>
              <TotalAnual data={totalAnualData} />
            </div>
          </section>
        )}

        {/* Série histórica tabela */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Série histórica {yearRange}</p>
            <div style={S.borderTop}>
              {years.map((year) => {
                const orc = loadTransporteOrcamento(year, MUNICIPIO)
                const dca = loadTransporteDca(year, MUNICIPIO)
                const isLatest = year === latestYear
                return (
                  <div key={year} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-6 py-4" style={S.borderBottom}>
                    <span className="font-mono font-semibold" style={{ fontSize: "15px", color: isLatest ? "var(--cyan-40)" : "var(--text-01)", minWidth: "40px" }}>
                      {year}
                    </span>
                    <div>
                      <p style={S.caption}>Dotação fixada</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                        {orc ? formatMillions(orc.dotacao_inicial) : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={S.caption}>Empenhado (RREO)</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: isLatest ? "var(--text-01)" : "var(--text-02)", fontWeight: isLatest ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                        {orc ? formatMillions(orc.empenhado) : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={S.caption}>Liquidado (DCA)</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: isLatest ? "var(--text-01)" : "var(--text-02)", fontWeight: isLatest ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                        {dca ? formatPrecise(dca.liquidado) : "—"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 (6º bimestre) e DCA Anexo I-E. IBGE 3550308 = São Paulo/SP.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/seguranca" className="nav-link">Segurança pública</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
