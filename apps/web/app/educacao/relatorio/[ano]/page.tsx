import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYears,
  loadYearData,
  loadRevenueData,
  formatMillions,
  formatPrecise,
  FUNCAO_LABELS,
  TOTAL_ROW,
  type HealthArea,
} from "@/lib/data"
import { InfoTooltip } from "@/components/ui/info-tooltip"
import { RastroDinheiro } from "@/components/rastro/rastro-dinheiro"

const AREA: HealthArea = "educacao"
const PERIODO_ANUAL = 4  // educação trimestral: T4 = acumulado Jan-Dez

interface PageProps {
  params:       Promise<{ ano: string }>
  searchParams: Promise<{ t?: string }>
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

const TRIMESTRE_LABELS: Record<number, string> = {
  1: "1º trimestre — Jan a Mar",
  2: "2º trimestre — Jan a Jun (acumulado)",
  3: "3º trimestre — Jan a Set (acumulado)",
  4: "4º trimestre — Jan a Dez (acumulado anual)",
}

const COLS: { label: string; tip: string }[] = [
  { label: "Função",             tip: "Programa de educação pública municipal." },
  { label: "Dotação atualizada", tip: "Orçamento autorizado para o período." },
  { label: "Empenhada",          tip: "Valor comprometido por contrato ou empenho." },
  { label: "Liquidada",          tip: "Serviço entregue e verificado pela prefeitura." },
  { label: "Paga",               tip: "Valor efetivamente transferido." },
  { label: "% do total",         tip: "Participação da função no total liquidado em educação." },
  { label: "Exec.",              tip: "Execução orçamentária: valor liquidado dividido pela dotação atualizada." },
]

const FUNCAO_TIPS: Record<string, string> = {
  "ensino fundamental": "Manutenção de escolas públicas, salários de professores e materiais didáticos do ensino fundamental (6–14 anos).",
  "educacao infantil":  "Creches (0–3 anos) e pré-escolas (4–5 anos) públicas municipais.",
}

function pct(part: number, total: number): string {
  if (!total) return "—"
  return `${((part / total) * 100).toFixed(1)}%`
}

export default async function RelatorioEducacaoPage({ params, searchParams }: PageProps) {
  const { ano } = await params
  const { t }   = await searchParams

  if (!/^\d{4}$/.test(ano)) notFound()
  const year           = Number(ano)
  const availableYears = getAvailableYears(AREA)

  if (!availableYears.includes(year)) notFound()

  const allData = loadYearData(year, AREA)
  const trims   = [...new Set(allData.map((r) => r.quadrimestre))].sort()
  const trim    = trims.includes(Number(t)) ? Number(t) : trims[trims.length - 1]

  const rows   = allData.filter((r) => r.quadrimestre === trim)
  const total  = rows.find((r) => r.funcao === TOTAL_ROW[AREA])
  const detail = rows.filter((r) => r.funcao !== TOTAL_ROW[AREA])

  const prevYear = availableYears.find((y) => y < year) ?? null
  const prevRows = prevYear
    ? loadYearData(prevYear, AREA).filter((r) => r.quadrimestre === trim)
    : []
  const prevByFuncao: Record<string, number> = Object.fromEntries(
    prevRows.map((r) => [r.funcao, r.liquidada])
  )

  const revenueRows = loadRevenueData(year, AREA)
  const revQ = revenueRows.find((r) => r.quadrimestre === trim)
            ?? revenueRows.find((r) => r.quadrimestre === PERIODO_ANUAL)
            ?? null

  // 2023 T3: dotação marcada com * no PDF oficial (não atribuída por natureza econômica)
  const dotacaoAusente = year === 2023 && trim === 3 && (total?.dotacao ?? 0) === 0

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/"                      className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/educacao"              className="nav-link" style={{ fontSize: "12px" }}>Educação</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/educacao/comparativo"  className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* Header */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Sorocaba / SP · Educação</p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Despesas em educação — {year}
                </h1>
              </div>
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link key={y} href={`/educacao/relatorio/${y}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:   y === year ? "var(--text-01)" : "var(--text-04)",
                    border:  `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                  }}>
                    {y}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs de trimestre */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6" style={S.container}>
            <div className="section-tabs">
              {trims.map((t_) => (
                <Link key={t_} href={`/educacao/relatorio/${year}?t=${t_}`} style={{
                  display: "block",
                  padding: "12px 20px",
                  fontSize: "13px",
                  color:         t_ === trim ? "var(--text-01)" : "var(--text-03)",
                  borderBottom:  t_ === trim ? "2px solid var(--blue-60)" : "2px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}>
                  {t_}º trim
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Nota de dotação ausente — 2023 T3 */}
        {dotacaoAusente && (
          <div style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
            <div className="mx-auto px-6 py-4" style={S.container}>
              <p style={{ fontSize: "13px", lineHeight: "20px", color: "var(--text-03)", borderLeft: "3px solid var(--border-02)", paddingLeft: "12px" }}>
                <strong style={{ color: "var(--text-02)" }}>Dotação não publicada neste relatório.</strong>{" "}
                O PDF oficial deste trimestre marca a coluna de dotação com <code>*</code>, indicando que os valores não foram discriminados por classificação econômica.
                As colunas de empenhado, liquidado e pago estão corretas. A taxa de execução não pode ser calculada para este período.
              </p>
            </div>
          </div>
        )}

        {/* Summary bar */}
        {total && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-8" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>
                {TRIMESTRE_LABELS[trim] ?? `${trim}º trimestre`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
                {([
                  { label: "Dotação atualizada", value: total.dotacao },
                  { label: "Empenhada",           value: total.empenhada },
                  { label: "Liquidada",           value: total.liquidada },
                  { label: "Paga",                value: total.paga },
                ] as { label: string; value: number }[]).map((item, i) => (
                  <div key={item.label} className="py-6" style={{
                    paddingRight: i < 3 ? "32px" : 0,
                    paddingLeft:  i > 0 ? "32px" : 0,
                    borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}>
                    <p className="font-mono font-medium mb-1" style={{ fontSize: "clamp(18px, 2.5vw, 28px)", lineHeight: "1.1", color: "var(--text-01)" }}>
                      {formatMillions(item.value)}
                    </p>
                    <p className="font-mono mb-2" style={S.caption}>{formatPrecise(item.value)}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-03)" }}>{item.label}</p>
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
            periodLabel={TRIMESTRE_LABELS[trim] ?? `${trim}º trimestre`}
            documentSource="Relatórios de Aplicação no Ensino publicados pela Prefeitura de Sorocaba."
            documentLinks={[...new Set(rows.map((r) => r.fonte_pdf).filter(Boolean))]}
            sources={[
              {
                label: "Impostos próprios",
                value: revQ?.proprios_arrecadado ?? 0,
                note: "Valor arrecadado registrado na base fiscal da educacao.",
              },
              {
                label: "Transferências do Estado",
                value: revQ?.transferencias_estaduais_arrecadado ?? 0,
                note: "Repasses estaduais registrados na base fiscal da educacao.",
              },
              {
                label: "Transferências da União",
                value: revQ?.transferencias_federais_arrecadado ?? 0,
                note: "Repasses federais registrados na base fiscal da educacao.",
              },
            ]}
            stages={[
              {
                label: "Dotação atualizada",
                value: total.dotacao,
                note: "Orçamento autorizado no relatório agregado.",
              },
              {
                label: "Empenhada",
                value: total.empenhada,
                note: "Valor comprometido no relatório agregado.",
              },
              {
                label: "Liquidada",
                value: total.liquidada,
                note: "Valor entregue/conferido segundo o relatório agregado.",
              },
              {
                label: "Paga",
                value: total.paga,
                note: "Valor pago segundo o relatório agregado.",
              },
            ]}
            destinations={detail.map((row) => ({
              label: FUNCAO_LABELS[AREA][row.funcao] ?? row.funcao,
              value: row.liquidada,
            }))}
          />
        )}

        {/* Mínimo constitucional */}
        {revQ && revQ.total_base_arrecadado > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-6" style={S.container}>
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                <div style={{ flex: "0 0 auto" }}>
                  <p className="uppercase font-semibold mb-1" style={S.label}>
                    Mínimo constitucional — 25% (Art. 256 CE-SP)
                  </p>
                  <p className="font-mono" style={{ fontSize: "24px", color: revQ.percentual_aplicado_liquidado >= 25 ? "var(--blue-40)" : "#fa4d56" }}>
                    {revQ.percentual_aplicado_liquidado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </p>
                  <p style={{ ...S.caption, marginTop: "4px" }}>aplicado no {trim}º trimestre</p>
                </div>
                <div className="flex gap-8 flex-wrap">
                  <div>
                    <p className="uppercase font-semibold mb-1" style={S.label}>Base (Rec. Líquidas)</p>
                    <p className="font-mono" style={{ fontSize: "16px", color: "var(--text-01)" }}>{formatMillions(revQ.total_base_arrecadado)}</p>
                    <p style={S.caption}>receitas após retenção FUNDEB</p>
                  </div>
                  <div>
                    <p className="uppercase font-semibold mb-1" style={S.label}>Mínimo exigido</p>
                    <p className="font-mono" style={{ fontSize: "16px", color: "var(--text-01)" }}>{formatMillions(revQ.minimo_saude_arrecadado)}</p>
                    <p style={S.caption}>25% da base arrecadada</p>
                  </div>
                </div>
                <div style={{ flex: "1 1 auto", ...S.caption, maxWidth: "380px" }}>
                  Base de cálculo: receitas líquidas de impostos (próprios + transferências − retenções ao FUNDEB).
                  O mínimo de 25% é exigido pelo Art. 256 da Constituição do Estado de São Paulo.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabela */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>
              Detalhamento por programa
            </p>
            {detail.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--text-03)" }}>Nenhum dado disponível para este trimestre.</p>
            ) : (
              <div className="table-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={S.borderBottom}>
                      {[
                        ...COLS,
                        ...(prevYear ? [{ label: `Δ vs. ${prevYear}`, tip: `Variação da despesa liquidada em relação ao mesmo trimestre de ${prevYear}.` }] : []),
                      ].map((col) => (
                        <th key={col.label} style={{ padding: "8px 16px 8px 0", textAlign: col.label === "Função" ? "left" : "right", ...S.label }}>
                          {col.label}
                          <InfoTooltip text={col.tip} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((row) => (
                      <tr key={row.funcao} style={S.borderBottom}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", color: "var(--text-01)" }}>
                          {FUNCAO_LABELS[AREA][row.funcao] ?? row.funcao}
                          <InfoTooltip text={FUNCAO_TIPS[row.funcao] ?? ""} />
                        </td>
                        <Num value={row.dotacao} />
                        <Num value={row.empenhada} />
                        <Num value={row.liquidada} />
                        <Num value={row.paga} />
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(row.liquidada, total?.liquidada ?? 0)}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(row.liquidada, row.dotacao)}
                        </td>
                        {prevYear && <Delta current={row.liquidada} prev={prevByFuncao[row.funcao]} />}
                      </tr>
                    ))}
                  </tbody>
                  {total && (
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--border-02)" }}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", fontWeight: 600, color: "var(--text-01)" }}>
                          Total liquidado em educação
                        </td>
                        <Num value={total.dotacao}   bold />
                        <Num value={total.empenhada} bold />
                        <Num value={total.liquidada} bold />
                        <Num value={total.paga}      bold />
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          100%
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {pct(total.liquidada, total.dotacao)}
                        </td>
                        {prevYear && <Delta current={total.liquidada} prev={prevByFuncao[TOTAL_ROW[AREA]]} bold />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
            <p className="mt-8" style={S.caption}>
              Fonte: Relatório de Aplicação no Ensino — Prefeitura de Sorocaba/SP.
              Valores em reais. {TRIMESTRE_LABELS[trim] ?? `${trim}º trimestre`} de {year}.
              Dados extraídos automaticamente do portal de transparência municipal.
              As dotações de Ensino Fundamental e Educação Infantil não são discriminadas individualmente no PDF — apenas o total consta.
            </p>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}

function Num({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td style={{
      padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right",
      color: "var(--text-02)", fontFamily: "var(--font-ibm-plex-mono)",
      fontWeight: bold ? 600 : 400, whiteSpace: "nowrap",
    }}>
      {formatPrecise(value)}
    </td>
  )
}

function Delta({ current, prev, bold }: { current: number; prev?: number; bold?: boolean }) {
  const tdStyle: React.CSSProperties = {
    padding: "14px 0 14px 0", fontSize: "12px", textAlign: "right",
    fontFamily: "var(--font-ibm-plex-mono)", fontWeight: bold ? 600 : 400, whiteSpace: "nowrap",
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
