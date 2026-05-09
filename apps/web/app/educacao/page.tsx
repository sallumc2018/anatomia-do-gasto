import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRevenueData,
  formatMillions,
  TOTAL_ROW,
  type HealthArea,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { ComparativoAnos, type ComparativoPoint } from "@/components/charts/ComparativoAnos"
import { PorPeriodo, type PorPeriodoPoint, TRIMS } from "@/components/charts/PorPeriodo"
import { RastroDinheiro } from "@/components/rastro/rastro-dinheiro"
import { TrackedReportLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Educação",
  description: "Gastos públicos com educação em Sorocaba: execução orçamentária, cumprimento do mínimo constitucional e evolução anual com fontes oficiais.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/educacao" },
}

const AREA: HealthArea = "educacao"
const PERIODO_ANUAL = 4  // educação é trimestral; T4 = acumulado Jan–Dez

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
  small: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const TRIMESTRE_LABEL: Record<number, string> = {
  1: "Acumulado Jan–Mar",
  2: "Acumulado Jan–Jun",
  3: "Acumulado Jan–Set",
  4: "Acumulado Jan–Dez",
}

export default function EducacaoPage() {
  const years      = getAvailableYears(AREA)
  const latestYear = years[0]

  const latestRows = latestYear ? loadYearData(latestYear, AREA) : []
  const latestT    = latestRows.filter((r) => r.quadrimestre === PERIODO_ANUAL)
  const areaTotal  = TOTAL_ROW[AREA]

  const totalLiquidado = latestT.find((r) => r.funcao === areaTotal)?.liquidada ?? 0
  const ensinoFund     = latestT.find((r) => r.funcao === "ensino fundamental")?.liquidada ?? 0
  const educInfantil   = latestT.find((r) => r.funcao === "educacao infantil")?.liquidada ?? 0

  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const chartYears = [...years].reverse()
  const yearData: Record<number, ReturnType<typeof loadYearData>> = {}
  for (const year of chartYears) {
    yearData[year] = loadYearData(year, AREA)
  }

  const porPeriodoData: PorPeriodoPoint[] = chartYears.map((year) => {
    const rows = yearData[year]
    const t1acc = rows.find((r) => r.quadrimestre === 1 && r.funcao === areaTotal)?.liquidada ?? 0
    const t2acc = rows.find((r) => r.quadrimestre === 2 && r.funcao === areaTotal)?.liquidada ?? 0
    const t3acc = rows.find((r) => r.quadrimestre === 3 && r.funcao === areaTotal)?.liquidada ?? 0
    const t4acc = rows.find((r) => r.quadrimestre === 4 && r.funcao === areaTotal)?.liquidada ?? 0
    return {
      year: String(year),
      "1º trim": t1acc,
      "2º trim": Math.max(0, t2acc - t1acc),
      "3º trim": Math.max(0, t3acc - t2acc),
      "4º trim": Math.max(0, t4acc - t3acc),
    }
  })

  const revenueRows  = latestYear ? loadRevenueData(latestYear, AREA) : []
  const latestRevQ   = revenueRows.find((r) => r.quadrimestre === 4)
                    ?? revenueRows.find((r) => r.quadrimestre === 3)
                    ?? revenueRows.find((r) => r.quadrimestre === 2)
                    ?? revenueRows.find((r) => r.quadrimestre === 1)
                    ?? null

  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => ({
    year:  String(year),
    total: yearData[year].find((r) => r.quadrimestre === PERIODO_ANUAL && r.funcao === areaTotal)?.liquidada ?? 0,
  }))

  const FUNCAO_ABREV: Record<string, string> = {
    "ensino fundamental": "Ensino Fundamental",
    "educacao infantil":  "Educação Infantil",
  }

  const chartData: ComparativoPoint[] = Object.keys(FUNCAO_ABREV).map((funcao) => {
    const point: ComparativoPoint = { funcao: FUNCAO_ABREV[funcao]! }
    for (const year of chartYears) {
      const row = yearData[year].find((r) => r.quadrimestre === PERIODO_ANUAL && r.funcao === funcao)
      point[String(year)] = row?.liquidada ?? 0
    }
    return point
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Educação em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                Acompanhe os investimentos em Ensino Fundamental, Educação Infantil e os recursos do FUNDEB.
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Educação · {yearRange}
              </p>
            </div>
          </div>
        </section>

        {/* Relatórios */}
        <section id="consultar" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Relatórios disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {years.map((year) => {
                const rows = yearData[year] ?? []
                const val = rows.find((r) => r.quadrimestre === PERIODO_ANUAL && r.funcao === areaTotal)?.liquidada ?? 0
                return (
                  <TrackedReportLink key={year} href={`/educacao/relatorio/${year}`} area={AREA} year={year} className="tile-link" style={{ border: "1px solid var(--border-01)", borderRadius: "8px" }}>
                    <div style={{ padding: "20px" }}>
                      <p style={S.label}>{year}</p>
                      <p className="mt-2 font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                        {val > 0 ? formatMillions(val) : "—"}
                      </p>
                      <p style={S.caption} className="mt-1">liquidado Jan-Dez</p>
                    </div>
                  </TrackedReportLink>
                )
              })}
            </div>
          </div>
        </section>

        {/* Nav interna */}
        <nav style={{ ...S.borderBottom, backgroundColor: "var(--bg-base)", position: "sticky", top: "48px", zIndex: 10 }}>
          <div className="mx-auto px-6 py-2 section-tabs" style={{ ...S.container, alignItems: "center", gap: "32px" }}>
            {[
              { id: "consultar",   label: "Relatórios" },
              { id: "rastro",      label: "Rastro" },
              { id: "receitas",    label: "Origem do dinheiro" },
              { id: "indicadores", label: "Onde foi gasto" },
              { id: "graficos",    label: "Histórico" },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`} style={{ ...S.label, color: "var(--text-01)", textDecoration: "none", fontSize: "12px" }} className="hover:opacity-70">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {latestYear && latestRevQ && totalLiquidado > 0 && (
          <RastroDinheiro
            area={AREA}
            year={latestYear}
            periodLabel={TRIMESTRE_LABEL[PERIODO_ANUAL]}
            documentSource="Relatórios de Aplicação no Ensino publicados pela Prefeitura de Sorocaba."
            sources={[
              {
                label: "Impostos próprios",
                value: latestRevQ.proprios_arrecadado,
                note: "Valor arrecadado registrado na base fiscal da educacao.",
              },
              {
                label: "Transferências do Estado",
                value: latestRevQ.transferencias_estaduais_arrecadado,
                note: "Repasses estaduais registrados na base fiscal da educacao.",
              },
              {
                label: "Transferências da União",
                value: latestRevQ.transferencias_federais_arrecadado,
                note: "Repasses federais registrados na base fiscal da educacao.",
              },
            ]}
            stages={[
              {
                label: "Dotação atualizada",
                value: latestT.find((r) => r.funcao === areaTotal)?.dotacao ?? 0,
                note: "Orçamento autorizado no relatório agregado.",
              },
              {
                label: "Empenhada",
                value: latestT.find((r) => r.funcao === areaTotal)?.empenhada ?? 0,
                note: "Valor comprometido no relatório agregado.",
              },
              {
                label: "Liquidada",
                value: totalLiquidado,
                note: "Valor entregue/conferido segundo o relatório agregado.",
              },
              {
                label: "Paga",
                value: latestT.find((r) => r.funcao === areaTotal)?.paga ?? 0,
                note: "Valor pago segundo o relatório agregado.",
              },
            ]}
            destinations={[
              { label: "Ensino fundamental", value: ensinoFund },
              { label: "Educação infantil", value: educInfantil },
              { label: "Demais funções da educação", value: Math.max(0, totalLiquidado - ensinoFund - educInfantil) },
            ]}
          />
        )}

        {/* Origem do dinheiro */}
        {latestRevQ && latestRevQ.total_base_arrecadado > 0 && (() => {
          const total   = latestRevQ.total_base_arrecadado
          const prop    = latestRevQ.proprios_arrecadado
          const est     = latestRevQ.transferencias_estaduais_arrecadado
          const fed     = latestRevQ.transferencias_federais_arrecadado
          const propPct = (prop / total * 100).toFixed(1)
          const estPct  = (est  / total * 100).toFixed(1)
          const fedPct  = (fed  / total * 100).toFixed(1)
          const pctApl  = latestRevQ.percentual_aplicado_liquidado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          const quadLabel = TRIMESTRE_LABEL[latestRevQ.quadrimestre] ?? `${latestRevQ.quadrimestre}º trimestre`
          return (
            <section id="receitas" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
              <div className="mx-auto px-6 py-16" style={S.container}>
                <p className="uppercase font-semibold mb-2" style={S.label}>
                  Base fiscal · Educação · Sorocaba · {latestYear} · {quadLabel}
                </p>
                <h2 className="font-light mb-2" style={S.h2}>
                  De onde vem o dinheiro destinado à educação
                </h2>
                <p className="mb-10" style={{ ...S.small, color: "var(--text-04)" }}>
                  A lei exige que pelo menos 25% das receitas líquidas de impostos seja aplicado em educação.
                  Sorocaba aplicou <span style={{ color: "var(--text-01)", fontWeight: 600 }}>{pctApl}%</span> em {latestYear}.
                </p>

                <div className="mb-2" style={{ display: "flex", width: "100%", gap: "2px", alignItems: "flex-end" }}>
                  {[
                    { pct: propPct, bg: "var(--blue-60)" },
                    { pct: estPct,  bg: "#525252" },
                    { pct: fedPct,  bg: "#8d8d8d" },
                  ].map((seg, i) => (
                    <div key={i} style={{ width: `${seg.pct}%`, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-02)", whiteSpace: "nowrap" }}>{seg.pct}%</span>
                      <div style={{ height: "12px", backgroundColor: seg.bg }} />
                    </div>
                  ))}
                </div>
                <div className="mb-10 flex gap-6 flex-wrap" style={{ fontSize: "11px", color: "var(--text-03)" }}>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--blue-60)", marginRight: "4px" }} />Impostos próprios {propPct}%</span>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#525252", marginRight: "4px" }} />Repasses do estado {estPct}%</span>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#8d8d8d", marginRight: "4px" }} />Repasses da União {fedPct}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
                  {([
                    { valor: prop, pct: propPct, cor: "var(--blue-60)" as string, label: "Impostos próprios", note: "IPTU, ISS, ITBI e IRRF arrecadados pelo município." },
                    { valor: est,  pct: estPct,  cor: "#525252"        as string, label: "Repasses do estado", note: "Cota-parte do ICMS, IPVA e IPI-Exportação repassados pelo Estado de SP." },
                    { valor: fed,  pct: fedPct,  cor: "#8d8d8d"        as string, label: "Repasses da União",  note: "FPM (Fundo de Participação dos Municípios) e outros repasses federais." },
                  ] as const).map((item, i) => (
                    <div key={i} className="py-8" style={{
                      paddingRight: i < 2 ? "32px" : 0,
                      paddingLeft:  i > 0 ? "32px" : 0,
                      borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                      ...S.borderBottom,
                    }}>
                      <p className="font-semibold mb-3" style={{ color: item.cor, fontSize: "13px" }}>{item.label}</p>
                      <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>{formatMillions(item.valor)}</p>
                      <p className="font-mono mb-4" style={{ fontSize: "12px", color: "var(--text-04)" }}>{item.pct}% da base fiscal</p>
                      <p style={S.small}>{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ fontSize: "14px", color: "var(--text-01)" }}>
                      Mínimo constitucional de 25% (Art. 256 CE-SP)
                    </p>
                    <p style={S.small}>
                      Municípios paulistas devem aplicar ao menos 25% das receitas líquidas de impostos em manutenção e desenvolvimento do ensino.
                      A base é calculada após dedução das retenções ao FUNDEB.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium" style={{ fontSize: "28px", color: latestRevQ.percentual_aplicado_liquidado >= 25 ? "var(--blue-40)" : "#fa4d56", lineHeight: "1" }}>
                      {pctApl}%
                    </p>
                    <p className="font-mono" style={{ fontSize: "11px", color: "var(--text-04)" }}>aplicado em educação</p>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* Indicadores */}
        {latestYear && totalLiquidado > 0 && (
          <section id="indicadores" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
            <div className="mx-auto px-6 py-16" style={S.container}>
              <p className="uppercase font-semibold mb-2" style={S.label}>
                Gastos em educação · {latestYear} · {TRIMESTRE_LABEL[PERIODO_ANUAL]}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
                {[
                  { valor: totalLiquidado, label: "Total liquidado",    note: "Soma de Ensino Fundamental e Educação Infantil." },
                  { valor: ensinoFund,     label: "Ensino Fundamental", note: "Manutenção de escolas públicas e salários de professores do ensino fundamental." },
                  { valor: educInfantil,   label: "Educação Infantil",  note: "Creches e pré-escolas municipais (0 a 5 anos)." },
                ].map((item, i) => (
                  <div key={i} className="py-8" style={{
                    paddingRight: i < 2 ? "32px" : 0,
                    paddingLeft:  i > 0 ? "32px" : 0,
                    borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}>
                    <p className="font-mono text-4xl" style={{ color: "var(--text-01)", marginBottom: "12px" }}>{formatMillions(item.valor)}</p>
                    <p className="uppercase font-semibold mb-2" style={S.label}>{item.label}</p>
                    <p style={S.body}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gráficos */}
        {chartYears.length > 0 && (
          <section id="graficos" style={{ backgroundColor: "var(--bg-base)", ...S.borderTop, ...S.borderBottom }}>
            <div className="mx-auto px-6 py-16" style={S.container}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                  <p className="uppercase font-semibold mb-3" style={S.label}>Histórico anual — total liquidado</p>
                  <TotalAnual data={totalAnualData} />
                </div>
                <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                  <p className="uppercase font-semibold mb-3" style={S.label}>Por trimestre</p>
                  <PorPeriodo data={porPeriodoData} periodos={TRIMS} />
                </div>
                <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                  <p className="uppercase font-semibold mb-3" style={S.label}>Comparativo por função</p>
                  <ComparativoAnos data={chartData} years={chartYears} />
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }}>
                <div>
                  <p style={{ fontSize: "14px", color: "var(--text-02)" }}>
                    Série histórica completa com detalhamento por função, taxa de execução, percentual MDE e variação ano a ano.
                  </p>
                </div>
                <Link href="/educacao/comparativo"
                  style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "24px" }}>
                  Ver série {yearRange} completa →
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>
      <PageFooter />
    </div>
  )
}
