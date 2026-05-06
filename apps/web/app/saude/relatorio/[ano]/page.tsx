import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRREODespesas,
  loadRREOReceitas,
  formatMillions,
  formatPrecise,
  FUNCAO_LABELS,
  TOTAL_ROW,
  type Area,
  type HealthRow,
} from "@/lib/data"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import { RastroDinheiro } from "@/components/rastro/rastro-dinheiro"

const AREA: Area = "saude"

// ── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ ano: string }>
  searchParams: Promise<{ q?: string }>
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
  h2: {
    fontSize: "28px",
    lineHeight: "36px",
    color: "var(--text-01)",
    fontWeight: 300,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const QUAD_LABELS: Record<number, string> = {
  1: "1º quadrimestre — Jan a Abr",
  2: "2º quadrimestre — Jan a Ago (acumulado)",
  3: "3º quadrimestre — Jan a Dez (acumulado anual)",
}

function buildCols(prevYear: number | null): { label: string; tip: string; href?: string }[] {
  return [
    { label: "Função",             tip: "Classificação do gasto por área de atuação da saúde pública." },
    { label: "Dotação atualizada", tip: "Orçamento autorizado para o período, atualizado com emendas e suplementações.", href: "/#dotacao" },
    { label: "Empenhada",          tip: "Valor comprometido por contrato ou nota de empenho.", href: "/#empenhada" },
    { label: "Liquidada",          tip: "Serviço entregue e verificado pela prefeitura.", href: "/#liquidada" },
    { label: "Paga",               tip: "Valor efetivamente transferido ao fornecedor.", href: "/#paga" },
    { label: "% pago",             tip: "Participação de cada função no total pago em saúde no período." },
    { label: "Exec.",              tip: "Execução orçamentária: valor liquidado dividido pela dotação atualizada." },
    ...(prevYear ? [{ label: `Δ vs. ${prevYear}`, tip: `Variação da despesa liquidada em relação ao mesmo quadrimestre de ${prevYear}.` }] : []),
  ]
}

const RREO_FUNCAO_LABELS: Record<string, string> = {
  "atencao basica":                        "Atenção básica",
  "assistencia hospitalar e ambulatorial": "Assistência hospitalar e ambulatorial",
  "suporte profilatico e terapeutico":     "Suporte profilático e terapêutico",
  "vigilancia sanitaria":                  "Vigilância sanitária",
  "vigilancia epidemiologica":             "Vigilância epidemiológica",
  "alimentacao e nutricao":                "Alimentação e nutrição",
  "outras subfuncoes":                     "Outras subfunções",
}

const RREO_FUNCAO_TIPS: Record<string, string> = {
  "atencao basica":                        "UBSs, postos de saúde, médicos de família e atenção primária.",
  "assistencia hospitalar e ambulatorial": "Hospitais, UPAs, internações e consultas com especialistas.",
  "suporte profilatico e terapeutico":     "Medicamentos especializados, órteses, próteses e insumos terapêuticos.",
  "vigilancia sanitaria":                  "Fiscalização de estabelecimentos de saúde, alimentos e produtos.",
  "vigilancia epidemiologica":             "Monitoramento de doenças, notificação de surtos e controle epidemiológico.",
  "alimentacao e nutricao":                "Programas de segurança alimentar e nutricional no âmbito da saúde.",
  "outras subfuncoes":                     "Subfunções de saúde que não se enquadram nas categorias principais — inclui saúde do trabalhador, saúde mental e outros programas municipais.",
}

const FUNCAO_TIPS: Record<string, string> = {
  "administracao geral":                   "Gestão da Secretaria de Saúde, pessoal administrativo e suporte institucional.",
  "atencao basica":                        "UBSs, postos de saúde, médicos de família, agentes comunitários e saúde bucal.",
  "assistencia hospitalar e ambulatorial": "Hospitais, UPAs, pronto-atendimentos, internações e consultas com especialistas.",
  "suporte profilatico e terapeutico":     "Medicamentos especializados, órteses, próteses e insumos terapêuticos.",
  "vigilancia sanitaria":                  "Fiscalização de estabelecimentos de saúde, alimentos e produtos.",
  "vigilancia epidemiologica":             "Monitoramento de doenças, notificação de surtos e ações de controle.",
  "alimentacao e nutricao":               "Programas de segurança alimentar e nutricional no âmbito da saúde.",
}

function pct(part: number, total: number): string {
  if (!total) return "—"
  return `${((part / total) * 100).toFixed(1)}%`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RelatorioSaudePage({ params, searchParams }: PageProps) {
  const { ano } = await params
  const { q } = await searchParams

  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)
  const availableYears = getAvailableYears(AREA)

  if (!availableYears.includes(year)) notFound()

  const allData = loadYearData(year, AREA)
  const quads   = [...new Set(allData.map((r) => r.quadrimestre))].sort()
  const quad    = quads.includes(Number(q)) ? Number(q) : quads[quads.length - 1]

  const rows   = allData.filter((r) => r.quadrimestre === quad)
  const total  = rows.find((r) => r.funcao === TOTAL_ROW[AREA])
  const detail = rows.filter((r) => r.funcao !== TOTAL_ROW[AREA])

  const prevYear = availableYears.find((y) => y < year) ?? null
  const prevRows = prevYear
    ? loadYearData(prevYear, AREA).filter((r) => r.quadrimestre === quad)
    : []
  const prevByFuncao: Record<string, number> = Object.fromEntries(
    prevRows.map((r) => [r.funcao, r.liquidada])
  )

  const rreoAll  = loadRREODespesas(year)
  const rreoTot  = rreoAll.find((r) => r.quadrimestre === quad && r.funcao === "TOTAL")
               ?? rreoAll.find((r) => r.funcao === "TOTAL")

  const rreoRecAll = loadRREOReceitas(year)
  const rreoRec    = rreoRecAll.find((r) => r.quadrimestre === quad)
                  ?? rreoRecAll.find((r) => r.quadrimestre === 3)
                  ?? rreoRecAll[rreoRecAll.length - 1]
                  ?? null

  return (
    <div className="min-h-screen flex flex-col">

      <ShellHeader />

      <main id="conteudo" className="flex-1">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={S.container}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>
              Início
            </Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/saude" className="nav-link" style={{ fontSize: "12px" }}>
              Saúde
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
                    href={`/saude/relatorio/${y}`}
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
              </div>
            </div>
          </div>
        </section>

        {/* ── Tabs de quadrimestre ────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6" style={S.container}>
            <div className="section-tabs">
              {quads.map((q_) => (
                <Link
                  key={q_}
                  href={`/saude/relatorio/${year}?q=${q_}`}
                  style={{
                    display:       "block",
                    padding:       "12px 20px",
                    fontSize:      "13px",
                    color:         q_ === quad ? "var(--text-01)" : "var(--text-03)",
                    borderBottom:  q_ === quad ? "2px solid var(--blue-60)" : "2px solid transparent",
                    textDecoration: "none",
                    transition:    "color 100ms ease",
                    whiteSpace:    "nowrap",
                  }}
                >
                  {q_}º quad
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Summary bar ─────────────────────────────────────────────────── */}
        {total && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-8" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>
                {QUAD_LABELS[quad] ?? `${quad}º quadrimestre`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
                {(
                  [
                    { key: "dotacao",   label: "Dotação atualizada", value: total.dotacao },
                    { key: "empenhada", label: "Empenhada",           value: total.empenhada },
                    { key: "liquidada", label: "Liquidada",           value: total.liquidada },
                    { key: "paga",      label: "Paga",                value: total.paga },
                  ] as { key: keyof HealthRow; label: string; value: number }[]
                ).map((item, i) => (
                  <div
                    key={item.key}
                    className="py-6"
                    style={{
                      paddingRight: i < 3 ? "32px" : 0,
                      paddingLeft:  i > 0 ? "32px" : 0,
                      borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                      ...S.borderBottom,
                    }}
                  >
                    <p
                      className="font-mono font-medium mb-1"
                      style={{ fontSize: "clamp(18px, 2.5vw, 28px)", lineHeight: "1.1", color: "var(--text-01)" }}
                    >
                      {formatMillions(item.value)}
                    </p>
                    <p className="font-mono mb-2" style={S.caption}>
                      {formatPrecise(item.value)}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-03)" }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {total && (
          <RastroDinheiro
            area={AREA}
            year={year}
            periodLabel={QUAD_LABELS[quad] ?? `${quad}º quadrimestre`}
            documentSource="Relatorios de Aplicacao da LRF e RREO Anexo 12 publicados pela Prefeitura de Sorocaba."
            sources={[
              {
                label: "Recursos municipais ASPS",
                value: rreoTot?.asps_liquidada ?? total.liquidada,
                note: "Valor ASPS liquidado no RREO Anexo 12 quando disponivel; caso contrario, total liquidado no relatorio LRF.",
              },
              {
                label: "Transferencias SUS",
                value: rreoRec?.sus_total_arrecadado ?? 0,
                note: "Transferencias federais e estaduais do SUS registradas no RREO Anexo 12.",
              },
            ]}
            stages={[
              {
                label: "Dotacao atualizada",
                value: total.dotacao,
                note: "Orcamento autorizado no relatorio agregado.",
              },
              {
                label: "Empenhada",
                value: total.empenhada,
                note: "Valor comprometido no relatorio agregado.",
              },
              {
                label: "Liquidada",
                value: total.liquidada,
                note: "Valor entregue/conferido segundo o relatorio agregado.",
              },
              {
                label: "Paga",
                value: total.paga,
                note: "Valor pago segundo o relatorio agregado.",
              },
            ]}
            destinations={detail.map((row) => ({
              label: FUNCAO_LABELS[AREA][row.funcao] ?? row.funcao,
              value: row.liquidada,
            }))}
          />
        )}

        {/* ── RREO callout ────────────────────────────────────────────────── */}
        {rreoTot && rreoTot.total_liquidada > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-8" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>
                RREO Anexo 12 — Gasto total em saúde · {quad}º quadrimestre
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
                {([
                  {
                    label: "Total liquidado",
                    value: formatMillions(rreoTot.total_liquidada),
                    note:  "ASPS + recursos SUS. Gasto real total em saúde no período.",
                    cor:   "var(--text-01)" as string,
                  },
                  {
                    label: "ASPS — mínimo constitucional",
                    value: formatMillions(rreoTot.asps_liquidada),
                    note:  "Despesas que contam para o limite de 15% (LC 141/2012).",
                    cor:   "var(--blue-60)" as string,
                  },
                  {
                    label: "Recursos SUS transferidos",
                    value: formatMillions(rreoTot.sus_liquidada),
                    note:  rreoRec && rreoRec.sus_total_arrecadado > 0
                      ? `União: ${formatMillions(rreoRec.sus_uniao_arrecadado)} · Estado SP: ${formatMillions(rreoRec.sus_estados_arrecadado)}`
                      : "Transferências federais e estaduais do SUS.",
                    cor:   "#525252" as string,
                  },
                  {
                    label: "% ASPS aplicado",
                    value: rreoRec
                      ? `${rreoRec.percentual_asps.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                      : "—",
                    note:  "Percentual das receitas próprias aplicado em saúde. Mínimo exigido: 15%.",
                    cor:   "var(--text-01)" as string,
                  },
                ] as const).map((item, i) => (
                  <div key={i} className="py-6" style={{
                    paddingRight: i < 3 ? "24px" : 0,
                    paddingLeft:  i > 0 ? "24px" : 0,
                    borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}>
                    <p className="font-semibold mb-2" style={{ color: item.cor, fontSize: "12px", letterSpacing: "0.04em" }}>
                      {item.label}
                    </p>
                    <p className="font-mono" style={{ fontSize: "clamp(16px, 2vw, 22px)", color: "var(--text-01)", marginBottom: "6px" }}>
                      {item.value}
                    </p>
                    <p style={S.caption}>{item.note}</p>
                  </div>
                ))}
              </div>
              {(() => {
                const funcRows = rreoAll
                  .filter((r) => r.quadrimestre === quad && r.funcao !== "TOTAL")
                  .filter((r) => r.total_liquidada > 0)
                if (funcRows.length === 0) return null
                const totalLiq = rreoTot?.total_liquidada ?? 0
                return (
                  <div className="mt-8" style={{ borderTop: "1px solid var(--border-01)", paddingTop: "16px" }}>
                    <p className="uppercase font-semibold mb-4" style={S.label}>
                      Gasto total por função · RREO Anexo 12
                    </p>
                    <div className="table-scroll">
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {(["Função", "ASPS liq.", "SUS liq.", "Total liq.", "% do total"] as const).map((h) => (
                              <th key={h} style={{ ...S.label, padding: "6px 12px 6px 0", textAlign: h === "Função" ? "left" : "right" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {funcRows.map((r) => (
                            <tr key={r.funcao} style={S.borderBottom}>
                              <td style={{ padding: "10px 12px 10px 0", fontSize: "13px", color: "var(--text-01)" }}>
                                {RREO_FUNCAO_LABELS[r.funcao] ?? r.funcao}
                                <InfoTooltip text={RREO_FUNCAO_TIPS[r.funcao] ?? ""} />
                              </td>
                              <RreoNum value={r.asps_liquidada} />
                              <RreoNum value={r.sus_liquidada} />
                              <RreoNum value={r.total_liquidada} />
                              <td style={{ padding: "10px 0 10px 0", fontSize: "12px", textAlign: "right", color: "var(--text-04)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                                {totalLiq ? `${((r.total_liquidada / totalLiq) * 100).toFixed(1)}%` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}

              <p className="mt-6" style={S.caption}>
                A tabela abaixo reflete apenas as despesas ASPS — as que contam para o limite constitucional de 15% (LC 141/2012).
                Os recursos SUS são executados pela mesma secretaria mas financiados por transferências da União e do Estado.
              </p>
            </div>
          </section>
        )}

        {/* ── Tabela de detalhes ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>
              Detalhamento por função de saúde
            </p>

            {detail.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--text-03)" }}>
                Nenhum dado disponível para este quadrimestre.
              </p>
            ) : (
              <div className="table-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ ...S.borderBottom }}>
                      {buildCols(prevYear).map((col) => (
                        <th
                          key={col.label}
                          style={{
                            padding:   "8px 16px 8px 0",
                            textAlign: col.label === "Função" ? "left" : "right",
                            ...S.label,
                          }}
                        >
                          {col.label}
                          <InfoTooltip text={col.tip} href={col.href} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((row) => (
                      <tr key={row.funcao} style={{ ...S.borderBottom }}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", color: "var(--text-01)" }}>
                          {FUNCAO_LABELS[AREA][row.funcao] ?? row.funcao}
                          <InfoTooltip text={FUNCAO_TIPS[row.funcao] ?? ""} />
                        </td>
                        <Num value={row.dotacao} />
                        <Num value={row.empenhada} />
                        <Num value={row.liquidada} />
                        <Num value={row.paga} />
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(row.paga, total?.paga ?? 0)}
                        </td>
                        <td style={{ padding: "14px 0 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(row.liquidada, row.dotacao)}
                        </td>
                        {prevYear && (
                          <Delta current={row.liquidada} prev={prevByFuncao[row.funcao]} />
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {total && (
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--border-02)" }}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", fontWeight: 600, color: "var(--text-01)" }}>
                          Total liquidado em saúde
                        </td>
                        <Num value={total.dotacao}   bold />
                        <Num value={total.empenhada} bold />
                        <Num value={total.liquidada} bold />
                        <Num value={total.paga}      bold />
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          100%
                        </td>
                        <td style={{ padding: "14px 0 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(total.liquidada, total.dotacao)}
                        </td>
                        {prevYear && (
                          <Delta current={total.liquidada} prev={prevByFuncao[TOTAL_ROW[AREA]]} bold />
                        )}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            <p className="mt-8" style={S.caption}>
              Fonte: Relatório de Aplicação da LRF — Prefeitura de Sorocaba/SP.
              Valores em reais. {QUAD_LABELS[quad] ?? `${quad}º quadrimestre`} de {year}.
              Dados extraídos automaticamente do portal de transparência municipal.
              Liquidado = serviço entregue e verificado. Não inclui saúde
              indireta (administração de benefícios e outros).
            </p>
          </div>
        </section>

      </main>

      <PageFooter />

    </div>
  )
}

// ── Cell helpers ──────────────────────────────────────────────────────────────

function Num({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td
      style={{
        padding:    "14px 16px 14px 0",
        fontSize:   "13px",
        textAlign:  "right",
        color:      "var(--text-02)",
        fontFamily: "var(--font-ibm-plex-mono)",
        fontWeight: bold ? 600 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {formatPrecise(value)}
    </td>
  )
}

function RreoNum({ value }: { value: number }) {
  return (
    <td style={{ padding: "10px 12px 10px 0", fontSize: "12px", textAlign: "right", color: "var(--text-02)", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap" }}>
      {formatMillions(value)}
    </td>
  )
}

function Delta({ current, prev, bold }: { current: number; prev?: number; bold?: boolean }) {
  const tdStyle: React.CSSProperties = {
    padding:    "14px 0 14px 0",
    fontSize:   "12px",
    textAlign:  "right",
    fontFamily: "var(--font-ibm-plex-mono)",
    fontWeight: bold ? 600 : 400,
    whiteSpace: "nowrap",
  }
  if (!prev) return <td style={{ ...tdStyle, color: "var(--text-04)" }}>—</td>
  const change = ((current - prev) / prev) * 100
  const sign   = change >= 0 ? "+" : ""
  const arrow  = change >= 0 ? "↑" : "↓"
  return (
    <td style={{ ...tdStyle, color: change >= 0 ? "var(--text-02)" : "var(--text-03)" }}>
      {arrow} {sign}{change.toFixed(1)}%
    </td>
  )
}
