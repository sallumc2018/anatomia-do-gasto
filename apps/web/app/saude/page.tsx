import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRevenueData,
  loadRevenueDetailData,
  loadRREODespesas,
  loadRREOReceitas,
  formatMillions,
  TOTAL_ROW,
  type RevenueDetailRow,
  type HealthArea,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { PorPeriodo, type PorPeriodoPoint } from "@/components/charts/PorPeriodo"
import { ComparativoAnos, type ComparativoPoint } from "@/components/charts/ComparativoAnos"
import { RastroDinheiro } from "@/components/rastro/rastro-dinheiro"
import { TrackedReportLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Saúde em Sorocaba",
  description: "Execução orçamentária de saúde em Sorocaba 2020–2025: ASPS, recursos SUS, mínimo constitucional de 15% e fontes por relatório oficial.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/saude" },
  openGraph: {
    title: "Saúde em Sorocaba | Anatomia do Gasto",
    description: "Execução orçamentária de saúde em Sorocaba 2020–2025: ASPS, recursos SUS, mínimo constitucional de 15% e fontes por relatório oficial.",
    url: "https://www.anatomiadogasto.ong.br/saude",
  },
}

const AREA: HealthArea = "saude"

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

  const areaTotal = TOTAL_ROW[AREA] || "total saude"
  const totalLiquidado = q3.find((r) => r.funcao === areaTotal)?.liquidada ?? 0
  const atencaoBasica = q3.find((r) => r.funcao === "atencao basica")?.liquidada ?? 0
  const hospitalar = q3.find((r) => r.funcao === "assistencia hospitalar e ambulatorial")?.liquidada ?? 0

  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const chartYears = [...years].reverse()

  const yearData: Record<number, ReturnType<typeof loadYearData>> = {}
  for (const year of chartYears) {
    yearData[year] = loadYearData(year, AREA)
  }

  const rreoRows = latestYear ? loadRREODespesas(latestYear) : []
  const rreoQ3   = rreoRows.find((r) => r.quadrimestre === 3 && r.funcao === "TOTAL")
               ?? rreoRows.find((r) => r.quadrimestre === 2 && r.funcao === "TOTAL")
               ?? rreoRows.find((r) => r.quadrimestre === 1 && r.funcao === "TOTAL")
               ?? null

  const rreoReceitasRows = latestYear ? loadRREOReceitas(latestYear) : []
  const rreoRecQ = rreoReceitasRows.find((r) => r.quadrimestre === 3)
               ?? rreoReceitasRows.find((r) => r.quadrimestre === 2)
               ?? rreoReceitasRows.find((r) => r.quadrimestre === 1)
               ?? null

  const revenueDetail: RevenueDetailRow[] = latestYear ? loadRevenueDetailData(latestYear, AREA) : []
  const revenueRows = latestYear ? loadRevenueData(latestYear, AREA) : []
  const latestRevQ  = revenueRows.find((r) => r.quadrimestre === 3)
               ?? revenueRows.find((r) => r.quadrimestre === 2)
               ?? revenueRows.find((r) => r.quadrimestre === 1)
               ?? null

  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => ({
    year: String(year),
    total: yearData[year].find((r) => r.quadrimestre === 3 && r.funcao === areaTotal)?.liquidada ?? 0,
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
    "assistencia hospitalar e ambulatorial":        "Hospitalar",
    "suporte profilatico e terapeutico":            "Profilático",
    "vigilancia sanitaria":                         "Vigilância sanitária",
    "vigilancia epidemiologica":                    "Vigilância epidemiológica",
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
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Saúde em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                Acompanhe os investimentos na proteção da população, hospitais, atenção básica e vigilância sanitária.
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Saúde · {yearRange}
              </p>
            </div>
          </div>
        </section>

        <section id="consultar" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Relatórios disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {years.map((year) => {
                const rows = yearData[year] ?? []
                const val = rows.find((r) => r.quadrimestre === 3 && r.funcao === TOTAL_ROW[AREA])?.liquidada ?? 0
                return (
                  <TrackedReportLink key={year} href={`/saude/relatorio/${year}`} area={AREA} year={year} className="tile-link" style={{ border: "1px solid var(--border-01)", borderRadius: "8px" }}>
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

        <nav style={{ ...S.borderBottom, backgroundColor: "var(--bg-base)", position: "sticky", top: "48px", zIndex: 10 }}>
          <div className="mx-auto px-6 py-2 section-tabs" style={{ ...S.container, alignItems: "center", gap: "32px" }}>
            {[
              { id: "consultar",   label: "Relatórios" },
              { id: "rastro",      label: "Rastro" },
              { id: "rreo",        label: "Gasto Total" },
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

        {latestYear && latestRevQ && totalLiquidado > 0 && (
          <RastroDinheiro
            area={AREA}
            year={latestYear}
            periodLabel="Acumulado Jan-Dez"
            documentSource="Relatórios de Aplicação da LRF e RREO Anexo 12 publicados pela Prefeitura de Sorocaba."
            sources={[
              {
                label: "Impostos próprios",
                value: latestRevQ.proprios_arrecadado,
                note: "Valor arrecadado registrado na base fiscal da saúde.",
              },
              {
                label: "Transferências do Estado",
                value: latestRevQ.transferencias_estaduais_arrecadado,
                note: "Repasses estaduais registrados na base fiscal da saúde.",
              },
              {
                label: "Transferências da União",
                value: latestRevQ.transferencias_federais_arrecadado,
                note: "Repasses federais registrados na base fiscal da saúde.",
              },
              {
                label: "Transferências SUS",
                value: rreoRecQ?.sus_total_arrecadado ?? 0,
                note: "Transferências federais e estaduais do SUS registradas no RREO Anexo 12.",
              },
            ]}
            stages={[
              {
                label: "Dotação atualizada",
                value: q3.find((r) => r.funcao === areaTotal)?.dotacao ?? 0,
                note: "Orçamento autorizado no relatório agregado.",
              },
              {
                label: "Empenhada",
                value: q3.find((r) => r.funcao === areaTotal)?.empenhada ?? 0,
                note: "Valor comprometido no relatório agregado.",
              },
              {
                label: "Liquidada",
                value: totalLiquidado,
                note: "Valor entregue/conferido segundo o relatório agregado.",
              },
              {
                label: "Paga",
                value: q3.find((r) => r.funcao === areaTotal)?.paga ?? 0,
                note: "Valor pago segundo o relatório agregado.",
              },
            ]}
            destinations={[
              { label: "Atenção básica", value: atencaoBasica },
              { label: "Assistência hospitalar e ambulatorial", value: hospitalar },
              { label: "Demais funções de saúde", value: Math.max(0, totalLiquidado - atencaoBasica - hospitalar) },
            ]}
          />
        )}

        {rreoQ3 && rreoQ3.total_liquidada > 0 && (() => {
          const asps  = rreoQ3.asps_liquidada
          const sus   = rreoQ3.sus_liquidada
          const total = rreoQ3.total_liquidada
          const aspsPct = ((asps / total) * 100).toFixed(1)
          const susPct  = ((sus  / total) * 100).toFixed(1)
          return (
            <section id="rreo" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
              <div className="mx-auto px-6 py-12" style={S.container}>
                <p className="uppercase font-semibold mb-2" style={S.label}>
                  Gasto total em saúde · {latestYear} · Acumulado Jan–Dez · RREO Anexo 12
                </p>
                <h2 className="font-light mb-2" style={S.h2}>
                  Além do mínimo constitucional
                </h2>
                <p className="mb-8" style={{ ...S.small, color: "var(--text-04)", maxWidth: "640px" }}>
                  Os relatórios LRF registram apenas as despesas ASPS — ações custeadas pelo município que contam para o mínimo de 15%.
                  A prefeitura também executa despesas financiadas por transferências federais e estaduais do SUS, que não entram no cálculo do mínimo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
                  {([
                    { label: "ASPS — Mínimo constitucional", value: asps, pct: aspsPct, cor: "var(--blue-60)",
                      note: "Ações e Serviços Públicos de Saúde custeados pelo município. Contam para o limite de 15% da LC 141/2012." },
                    { label: "Recursos SUS — Transferências", value: sus, pct: susPct, cor: "#525252",
                      note: "Despesas financiadas por transferências federais e estaduais do SUS. Não contam para o mínimo constitucional." },
                    { label: "Total liquidado em saúde", value: total, pct: "100", cor: "var(--text-03)",
                      note: `Soma de ASPS (${aspsPct}%) e recursos SUS (${susPct}%). Fonte: RREO Anexo 12 — Prefeitura de Sorocaba.` },
                  ] as const).map((item, i) => (
                    <div key={i} className="py-8" style={{
                      paddingRight: i < 2 ? "32px" : 0,
                      paddingLeft:  i > 0 ? "32px" : 0,
                      borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                      ...S.borderBottom,
                    }}>
                      <p className="font-semibold mb-3" style={{ color: item.cor, fontSize: "13px" }}>{item.label}</p>
                      <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>
                        {formatMillions(item.value)}
                      </p>
                      <p className="font-mono mb-4" style={{ fontSize: "12px", color: "var(--text-04)" }}>
                        {item.pct}% do total
                      </p>
                      <p style={S.small}>{item.note}</p>
                    </div>
                  ))}
                </div>

                {rreoRecQ && rreoRecQ.sus_total_arrecadado > 0 && (() => {
                  const totalSus  = rreoRecQ.sus_total_arrecadado
                  const uniao     = rreoRecQ.sus_uniao_arrecadado
                  const estados   = rreoRecQ.sus_estados_arrecadado
                  const uniPct    = ((uniao   / totalSus) * 100).toFixed(1)
                  const estPct    = ((estados / totalSus) * 100).toFixed(1)
                  const pctAsps   = rreoRecQ.percentual_asps.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  return (
                    <div className="mt-10">
                      <p className="uppercase font-semibold mb-1" style={S.label}>
                        Transferências SUS recebidas · {latestYear}
                      </p>
                      <p className="mb-6" style={{ ...S.small, color: "var(--text-04)", maxWidth: "640px" }}>
                        Recursos repassados pela União e pelo Estado de SP para financiar as ações SUS executadas pelo município.
                        Não entram no cálculo do mínimo constitucional.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
                        {([
                          {
                            label: "Da União",
                            value: uniao,
                            pct:   uniPct,
                            note:  "Transferências do governo federal (PAB, MAC, FAEC e outros blocos do SUS).",
                          },
                          {
                            label: "Do estado de SP",
                            value: estados,
                            pct:   estPct,
                            note:  "Repasses estaduais do SUS (convênios e programas estaduais de saúde).",
                          },
                          {
                            label: "% ASPS aplicado",
                            value: null as null,
                            pct:   null as null,
                            note:  "Percentual das receitas próprias aplicado em saúde, calculado sobre a base fiscal do RREO Anexo 12 (6º bimestre). Mínimo constitucional: 15%.",
                            asps:  pctAsps,
                          },
                        ] as const).map((item, i) => (
                          <div key={i} className="py-8" style={{
                            paddingRight: i < 2 ? "32px" : 0,
                            paddingLeft:  i > 0 ? "32px" : 0,
                            borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                            ...S.borderBottom,
                          }}>
                            <p className="font-semibold mb-3" style={{ color: "var(--text-03)", fontSize: "13px" }}>{item.label}</p>
                            {item.value !== null ? (
                              <>
                                <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>
                                  {formatMillions(item.value)}
                                </p>
                                <p className="font-mono mb-4" style={{ fontSize: "12px", color: "var(--text-04)" }}>
                                  {item.pct}% do total SUS
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>
                                  {item.asps}%
                                </p>
                                <p className="font-mono mb-4" style={{ fontSize: "12px", color: "var(--text-04)" }}>
                                  mínimo exigido: 15%
                                </p>
                              </>
                            )}
                            <p style={S.small}>{item.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>
          )
        })()}

        {latestRevQ && latestRevQ.total_base_arrecadado > 0 && (() => {
          const total  = latestRevQ.total_base_arrecadado
          const prop   = latestRevQ.proprios_arrecadado
          const est    = latestRevQ.transferencias_estaduais_arrecadado
          const fed    = latestRevQ.transferencias_federais_arrecadado
          const propPct = (prop / total * 100).toFixed(1)
          const estPct  = (est  / total * 100).toFixed(1)
          const fedPct  = (fed  / total * 100).toFixed(1)
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
                  O percentual aplicado consta no demonstrativo RREO Anexo 12 apresentado acima.
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
                    return (
                      <div
                        key={i}
                        className="py-8"
                        style={{
                          paddingRight: i < 2 ? "32px" : 0,
                          paddingLeft:  i > 0 ? "32px" : 0,
                          borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                          ...S.borderBottom,
                        }}
                      >
                        <p className="font-semibold mb-3" style={{ color: item.cor, fontSize: "13px" }}>
                          {item.label}
                        </p>
                        <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>
                          {formatMillions(item.valor)}
                        </p>
                        <p className="text-sm" style={S.small}>{item.note}</p>
                        {itens.length > 0 && (
                          <div className="mt-5" style={{ borderTop: "1px solid var(--border-01)", paddingTop: "12px" }}>
                            {itens.map((r) => (
                              <div key={r.conta} style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                                <span style={{ fontSize: "12px", color: "var(--text-03)" }}>{r.conta}</span>
                                <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", whiteSpace: "nowrap" }}>
                                  {formatMillions(r.valor)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })()}

        {/* ── Indicadores */}
        <section id="indicadores" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Onde foi gasto</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Total liquidado</p>
                <p className="font-mono text-4xl" style={{ color: "var(--text-01)", marginBottom: "12px" }}>
                  {formatMillions(totalLiquidado)}
                </p>
                <p style={S.body}>
                  Valor contabilizado até o terceiro quadrimestre para a função total de saúde.
                </p>
              </div>

              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Atenção básica</p>
                <p className="font-mono text-4xl" style={{ color: "var(--text-01)", marginBottom: "12px" }}>
                  {formatMillions(atencaoBasica)}
                </p>
                <p style={S.body}>Investimentos em UBS, equipes de saúde da família e atenção primária.</p>
              </div>

              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Hospitalar</p>
                <p className="font-mono text-4xl" style={{ color: "var(--text-01)", marginBottom: "12px" }}>
                  {formatMillions(hospitalar)}
                </p>
                <p style={S.body}>Recursos para hospitais, UPAs e serviços ambulatoriais.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="graficos" style={{ backgroundColor: "var(--bg-base)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Histórico anual</p>
                <TotalAnual data={totalAnualData} />
              </div>
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Por quadrimestre</p>
                <PorPeriodo data={porPeriodoData} />
              </div>
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Comparativo de funções</p>
                <ComparativoAnos data={chartData} years={chartYears} />
              </div>
            </div>
            <div className="mt-10 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }}>
              <div>
                <p style={{ fontSize: "14px", color: "var(--text-02)" }}>
                  Série histórica completa com detalhamento por função, taxa de execução e variação ano a ano.
                </p>
              </div>
              <Link href="/saude/comparativo"
                style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "24px" }}>
                Ver série {yearRange} completa →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
