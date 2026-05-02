import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRevenueData,
  loadRevenueDetailData,
  formatMillions,
  formatPrecise,
  TOTAL_ROW,
  type RevenueDetailRow,
  type Area,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { PorPeriodo, type PorPeriodoPoint } from "@/components/charts/PorPeriodo"
import { ComparativoAnos, type ComparativoPoint } from "@/components/charts/ComparativoAnos"

const AREA: Area = "saude"

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

export default function SaudePage() {
  const years = getAvailableYears(AREA)
  const latestYear = years[0]
  const q3 = latestYear
    ? loadYearData(latestYear, AREA).filter((r) => r.quadrimestre === 3)
    : []

  const totalLiquidado = q3.find((r) => r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0
  const atencaoBasica  = q3.find((r) => r.funcao === "atencao basica")?.liquidada ?? 0
  const assHospitalar  = q3.find((r) => r.funcao === "assistencia hospitalar e ambulatorial")?.liquidada ?? 0

  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const chartYears = [...years].reverse()

  const yearData: Record<number, ReturnType<typeof loadYearData>> = {}
  for (const year of chartYears) {
    yearData[year] = loadYearData(year, AREA)
  }

  const revenueDetail: RevenueDetailRow[] = latestYear ? loadRevenueDetailData(latestYear, AREA) : []
  const revenueRows = latestYear ? loadRevenueData(latestYear, AREA) : []
  const latestRevQ  = revenueRows.find((r) => r.quadrimestre === 3)
               ?? revenueRows.find((r) => r.quadrimestre === 2)
               ?? revenueRows.find((r) => r.quadrimestre === 1)
               ?? null

  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => ({
    year: String(year),
    total: yearData[year].find((r) => r.quadrimestre === 3 && r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0,
  }))

  const porPeriodoData: PorPeriodoPoint[] = chartYears.map((year) => {
    const rows = yearData[year]
    const q1    = rows.find((r) => r.quadrimestre === 1 && r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0
    const q2acc = rows.find((r) => r.quadrimestre === 2 && r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0
    const q3acc = rows.find((r) => r.quadrimestre === 3 && r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0
    return {
      year: String(year),
      "1º quad": q1,
      "2º quad": Math.max(0, q2acc - q1),
      "3º quad": Math.max(0, q3acc - q2acc),
    }
  })

  const FUNCAO_ABREV: Record<string, string> = {
    "administracao geral":                          "Adm. geral",
    "atencao basica":                               "Atenção básica",
    "assistencia hospitalar e ambulatorial":        "Hosp. e ambulatorial",
    "suporte profilatico e terapeutico":            "Suporte profilático",
    "vigilancia sanitaria":                         "Vig. sanitária",
    "vigilancia epidemiologica":                    "Vig. epidemiológica",
    "alimentacao e nutricao":                       "Alimentação e nutrição",
  }

  const chartData: ComparativoPoint[] = Object.keys(FUNCAO_ABREV).map((funcao) => {
    const point: ComparativoPoint = { funcao: FUNCAO_ABREV[funcao]! }
    for (const year of chartYears) {
      const row = yearData[year].find((r) => r.quadrimestre === 3 && r.funcao === funcao)
      point[String(year)] = row?.liquidada ?? 0
    }
    return point
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Saúde Pública em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                De onde vem e para onde vai o dinheiro da saúde: arrecadação, transferências e despesas liquidadas por área de atuação.
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Saúde · {yearRange}
              </p>
            </div>
          </div>
        </section>

        {/* Consultar dados */}
        <section id="consultar" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Relatórios disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {years.map((year) => (
                <Link key={year} href={`/relatorio/${year}?area=saude`} className="tile-link" style={{ border: "1px solid var(--border-01)" }}>
                  <div className="p-6 flex flex-col gap-4 h-full">
                    <p className="font-mono uppercase mb-1" style={{ fontSize: "11px", color: "var(--text-03)" }}>Sorocaba / SP</p>
                    <p className="font-mono font-medium" style={{ fontSize: "36px", color: "var(--text-01)" }}>{year}</p>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "var(--blue-40)", border: "1px solid var(--blue-60)", borderRadius: "2px", padding: "1px 6px" }}>SAÚDE</span>
                    <div className="mt-auto flex items-center gap-2" style={{ color: "var(--blue-50)", fontSize: "13px" }}>Ver relatório</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Navegação interna (Scroll) */}
        <nav style={{ ...S.borderBottom, backgroundColor: "var(--bg-base)", position: "sticky", top: "48px", zIndex: 10 }}>
          <div className="mx-auto px-6 flex gap-8" style={{ ...S.container, height: "48px", alignItems: "center" }}>
            {[
              { id: "consultar",   label: "Relatórios" },
              { id: "receitas",    label: "Origem do Dinheiro" },
              { id: "indicadores", label: "Onde foi gasto" },
              { id: "graficos",    label: "Histórico" },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`} style={{ ...S.label, color: "var(--text-01)", textDecoration: "none", fontSize: "12px" }} className="hover:opacity-70">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── De onde vem o dinheiro (Saúde - 15%) ────────────────────── */}
        {latestRevQ && latestRevQ.total_base_arrecadado > 0 && ((() => {
          const total  = latestRevQ.total_base_arrecadado
          const prop   = latestRevQ.proprios_arrecadado
          const est    = latestRevQ.transferencias_estaduais_arrecadado
          const fed    = latestRevQ.transferencias_federais_arrecadado
          const propPct = (prop / total * 100).toFixed(1)
          const estPct  = (est  / total * 100).toFixed(1)
          const fedPct  = (fed  / total * 100).toFixed(1)
          const pctApl  = latestRevQ.percentual_aplicado_liquidado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          const quadLabel = latestRevQ.quadrimestre === 3 ? "Acumulado Jan–Dez"
                          : latestRevQ.quadrimestre === 2 ? "Acumulado Jan–Ago"
                          : "Acumulado Jan–Abr"
          return (
            <section id="receitas" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
              <div className="mx-auto px-6 py-16" style={S.container}>
                <p className="uppercase font-semibold mb-2" style={S.label}>
                  Base fiscal · Saúde · Sorocaba · {latestYear} · {quadLabel}
                </p>
                <h2 className="font-light mb-2" style={S.h2}>
                  De onde vem o dinheiro destinado à saúde
                </h2>
                <p className="mb-10" style={{ ...S.small, color: "var(--text-04)" }}>
                  A lei exige que pelo menos 15% desta base seja aplicado em saúde.
                  Sorocaba aplicou <span style={{ color: "var(--text-01)", fontWeight: 600 }}>{pctApl}%</span> em {latestYear}.
                </p>

                <div className="mb-2" style={{ display: "flex", width: "100%", gap: "2px", alignItems: "flex-end" }}>
                  {[
                    { pct: propPct, bg: "var(--blue-60)" },
                    { pct: estPct,  bg: "#525252" },
                    { pct: fedPct,  bg: "#8d8d8d" },
                  ].map((seg, i) => (
                    <div key={i} style={{ width: `${seg.pct}%`, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-02)", whiteSpace: "nowrap" }}>
                        {seg.pct}%
                      </span>
                      <div style={{ height: "12px", backgroundColor: seg.bg }} />
                    </div>
                  ))}
                </div>
                <div className="mb-10 flex gap-6 flex-wrap" style={{ fontSize: "11px", color: "var(--text-03)" }}>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--blue-60)", marginRight: "4px" }} />Impostos próprios {propPct}%</span>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#525252", marginRight: "4px" }} />Repasses do estado {estPct}%</span>
                  <span><span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#8d8d8d", marginRight: "4px" }} />Repasses da União {fedPct}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3" style={S.borderTop}>
                  {(
                    [
                      {
                        valor:    prop,
                        pct:      propPct,
                        cor:      "var(--blue-60)" as string,
                        catKey:   "proprios" as const,
                        label:    "Impostos próprios do município",
                        note:     "Arrecadação direta: IPTU, ISS, ITBI e IRRF.",
                      },
                      {
                        valor:    est,
                        pct:      estPct,
                        cor:      "#525252" as string,
                        catKey:   "estaduais" as const,
                        label:    "Repasses do estado",
                        note:     "Cota-parte do ICMS, IPVA e IPI-Exportação repassados pelo Estado de SP.",
                      },
                      {
                        valor:    fed,
                        pct:      fedPct,
                        cor:      "#8d8d8d" as string,
                        catKey:   "federais" as const,
                        label:    "Repasses da União",
                        note:     "FPM (Fundo de Participação dos Municípios) e outros repasses da União.",
                      },
                    ] as const
                  ).map((item, i) => {
                    const itens = (revenueDetail || [])
                      .filter((r) => r.categoria === item.catKey)
                      .sort((a, b) => b.valor - a.valor)
                    const totalItens = itens.reduce((s, r) => s + r.valor, 0)
                    return (
                      <div
                        key={i}
                        className="py-8"
                        style={{
                          paddingRight: i < 2 ? "48px" : 0,
                          paddingLeft:  i > 0 ? "48px" : 0,
                          borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                          ...S.borderBottom,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div style={{ width: "3px", height: "28px", backgroundColor: item.cor, flexShrink: 0 }} />
                          <p
                            className="font-mono font-medium"
                            style={{ fontSize: "clamp(20px, 2.5vw, 32px)", lineHeight: "1.1", color: "var(--text-01)" }}
                          >
                            {formatMillions(item.valor)}
                          </p>
                        </div>
                        <p className="font-mono mb-3" style={{ ...S.caption, paddingLeft: "11px" }}>
                          {item.pct}% da base fiscal · {formatPrecise(item.valor)}
                        </p>
                        <p className="font-semibold mb-2" style={{ fontSize: "14px", color: "var(--text-01)" }}>
                          {item.label}
                        </p>
                        <p style={{ ...S.small, marginBottom: itens.length ? "16px" : 0 }}>
                          {item.note}
                        </p>
                        {itens.length > 0 && item.catKey !== "federais" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {itens.map((row) => {
                              const rowPct = totalItens > 0 ? (row.valor / totalItens) * 100 : 0
                              return (
                                <div key={row.conta}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                    <span style={{ fontSize: "12px", color: "var(--text-03)" }}>{row.conta}</span>
                                    <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)" }}>
                                      {rowPct < 1 && rowPct > 0 ? "< 1" : rowPct.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div style={{ height: "3px", backgroundColor: "var(--border-01)", borderRadius: "2px" }}>
                                    <div style={{ height: "3px", width: `${Math.max(rowPct, 1)}%`, backgroundColor: item.cor, borderRadius: "2px" }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-8 p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                  <div className="flex-1">
                    <p className="font-semibold mb-1" style={{ fontSize: "14px", color: "var(--text-01)" }}>
                      Mínimo constitucional de 15% (LC 141/2012)
                    </p>
                    <p style={S.small}>
                      Municípios devem aplicar ao menos 15% da receita de impostos e transferências em ações e serviços públicos de saúde.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium" style={{ fontSize: "28px", color: latestRevQ.percentual_aplicado_liquidado >= 15 ? "var(--blue-40)" : "#fa4d56", lineHeight: "1" }}>
                      {pctApl}%
                    </p>
                    <p className="font-mono" style={{ fontSize: "11px", color: "var(--text-04)" }}>aplicado em saúde</p>
                  </div>
                </div>
              </div>
            </section>
          )
        })())}

        {/* Indicadores-chave */}
        {latestYear && totalLiquidado > 0 && (
          <section id="indicadores" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
            <div className="mx-auto px-6 py-16" style={S.container}>
              <p className="uppercase font-semibold mb-2" style={S.label}>Gastos em saúde · {latestYear}</p>
              <div className="grid grid-cols-1 md:grid-cols-3" style={S.borderTop}>
                {[
                  { short: formatMillions(totalLiquidado), label: "Total liquidado", note: "Soma de todas as áreas de saúde." },
                  { short: formatMillions(atencaoBasica), label: "Atenção básica", note: "Postos de saúde (UBS), médicos de família e prevenção." },
                  { short: formatMillions(assHospitalar), label: "Hospitais e Especialidades", note: "Consultas especializadas e internações." },
                ].map((item, i) => (
                  <div key={i} className="py-8" style={{ paddingLeft: i > 0 ? "48px" : 0, borderLeft: i > 0 ? "1px solid var(--border-01)" : "none" }}>
                    <p className="font-mono font-medium mb-1" style={{ fontSize: "36px", color: "var(--text-01)" }}>{item.short}</p>
                    <p className="font-semibold mb-2" style={{ fontSize: "14px", color: "var(--text-01)" }}>{item.label}</p>
                    <p style={S.small}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gráficos */}
        {chartYears.length > 1 && (
          <section id="graficos" style={{ backgroundColor: "var(--bg-base)", ...S.borderTop }}>
            <div className="mx-auto px-6 py-16" style={S.container}>
              <h2 className="font-light mb-10" style={S.h2}>Histórico de gastos</h2>
              <TotalAnual data={totalAnualData} />
              <div className="mt-16">
                <ComparativoAnos data={chartData} years={chartYears} />
              </div>
            </div>
          </section>
        )}
      </main>
      <PageFooter />
    </div>
  )
}