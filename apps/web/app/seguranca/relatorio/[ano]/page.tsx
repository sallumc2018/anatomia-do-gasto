import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsSeguranca,
  loadSegurancaData,
  loadSegurancaOrcamento,
  SUBFUNCAO_LABELS,
} from "@/lib/data"

interface PageProps {
  params: Promise<{ ano: string }>
}

const SEGURANCA_TOTAL = "06 - Segurança Pública"

const SUBFUNCAO_TIPS: Record<string, string> = {
  "06.122 - Administração Geral":
    "Salários, administração interna e custos operacionais de base da Guarda Municipal.",
  "06.181 - Policiamento":
    "Patrulhamento, atendimento de ocorrências e vigilância de espaços públicos.",
  "06.182 - Defesa Civil":
    "Resposta a emergências, desastres naturais e apoio à população em risco.",
  "06.183 - Informação e Inteligência":
    "Monitoramento, análise de dados e inteligência operacional.",
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

function pct(part: number, total: number): string {
  if (!total) return "—"
  return `${((part / total) * 100).toFixed(1)}%`
}

function fmtDelta(current: number, prev: number | undefined): { text: string; up: boolean | null } {
  if (!prev || prev === 0) return { text: "—", up: null }
  const change = ((current - prev) / prev) * 100
  const sign = change >= 0 ? "+" : ""
  const arrow = change >= 0 ? "↑" : "↓"
  return { text: `${arrow} ${sign}${change.toFixed(1)}%`, up: change >= 0 }
}

export default async function RelatorioSegurancaPage({ params }: PageProps) {
  const { ano } = await params
  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)

  const availableYears = getAvailableYearsSeguranca()
  if (!availableYears.includes(year)) notFound()

  const rows  = loadSegurancaData(year)
  const total = rows.find((r) => r.subfuncao === SEGURANCA_TOTAL)
  const detail = rows.filter((r) => r.subfuncao !== SEGURANCA_TOTAL)

  const prevYear = availableYears.find((y) => y < year) ?? null
  const prevRows = prevYear ? loadSegurancaData(prevYear) : []
  const prevBySubfuncao: Record<string, number> = Object.fromEntries(
    prevRows.map((r) => [r.subfuncao, r.liquidada])
  )

  const orcamento = loadSegurancaOrcamento(year)
  const source = rows.find((r) => r.fonte_url)?.fonte_url ?? null

  const taxaExecucao = orcamento && orcamento.dotacao_atualizada > 0
    ? (orcamento.empenhado / orcamento.dotacao_atualizada) * 100
    : null

  const is2020or2021 = year <= 2021

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/seguranca" className="nav-link" style={{ fontSize: "12px" }}>Segurança</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/seguranca/comparativo" className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>
                  Sorocaba / SP · Segurança Pública · Exercício completo
                </p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Despesas em segurança pública — {year}
                </h1>
              </div>
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link key={y} href={`/seguranca/relatorio/${y}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:      y === year ? "var(--text-01)" : "var(--text-04)",
                    border:     `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding:    "4px 10px",
                    textDecoration: "none",
                  }}>
                    {y}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary bar ─────────────────────────────────────────────────── */}
        {total && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-8" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>
                DCA Anexo I-E · Exercício {year} · Sorocaba/SP
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
                {([
                  { label: "Empenhada",      value: total.empenhada },
                  { label: "Liquidada",       value: total.liquidada },
                  { label: "Paga",            value: total.paga },
                  { label: "Restos a pagar",  value: total.restos_nao_processados + total.restos_processados },
                ] as const).map((item, i) => (
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
              {/* RREO orçamento panel */}
              {orcamento ? (
                <div className="mt-6" style={{ border: "1px solid var(--border-01)" }}>
                  <div className="px-4 py-3" style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-03)", textTransform: "uppercase" }}>
                      RREO Anexo 02 · Bimestre 6 · Orçamento autorizado
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                    {[
                      { label: "Dotação inicial",      value: formatPrecise(orcamento.dotacao_inicial) },
                      { label: "Dotação atualizada",   value: formatPrecise(orcamento.dotacao_atualizada) },
                      { label: "Taxa de execução",     value: taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—" },
                      { label: "% do orç. municipal",  value: orcamento.pct_orcamento > 0 ? `${orcamento.pct_orcamento.toFixed(2)}%` : "—" },
                    ].map((item, i) => (
                      <div key={item.label} className="px-4 py-4" style={{
                        borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                      }}>
                        <p className="font-mono font-semibold" style={{ fontSize: "16px", color: "var(--text-01)" }}>{item.value}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-04)", marginTop: "4px" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      Valores EXCETO INTRA-ORÇAMENTÁRIAS — excluem transferências internas entre unidades.
                      Componente intra-orçamentário (auditoria): Empenhado {formatPrecise(orcamento.intra_empenhado)} ·
                      Liquidado {formatPrecise(orcamento.intra_liquidado)}.
                      {year === 2021
                        ? " Em 2021 o DCA consolidou EXCETO + INTRA no total da função — o RREO EXCETO fica R$7,77M abaixo do DCA. Anomalia declarada, não erro de extração."
                        : " Nos demais exercícios, DCA Empenhada = RREO EXCETO (padrão)."
                      }
                      {" "}Taxa = Empenhado EXCETO ÷ Dotação Atualizada.
                      % municipal = Segurança Pública / total EXCETO municipal ({formatPrecise(orcamento.total_municipal_empenhado)}).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.small, color: "var(--text-04)" }}>
                    O DCA Anexo I-E não registra dotação orçamentária. Por isso, não é possível calcular a taxa de
                    execução (pago ÷ dotação) da mesma forma que em saúde e educação.
                    Restos a pagar = não processados ({formatPrecise(total.restos_nao_processados)}) +
                    processados ({formatPrecise(total.restos_processados)}).
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Nota 2020-2021 ──────────────────────────────────────────────── */}
        {is2020or2021 && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-6" style={S.container}>
              <div className="p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", borderLeft: "4px solid #f1c21b" }}>
                <p className="font-semibold mb-2" style={{ color: "var(--text-01)", fontSize: "13px" }}>
                  Estrutura de subfunções em {year}
                </p>
                <p style={{ ...S.small, color: "var(--text-03)" }}>
                  Em {year}, o DCA de Sorocaba registrou apenas as subfunções 06.181 (Policiamento) e 06.182 (Defesa Civil).
                  A subfunção 06.122 (Administração Geral) passou a ser declarada separadamente a partir de 2022,
                  quando absorveu a maior parte do orçamento que antes constava em Policiamento.
                  Isso reflete provavelmente uma mudança na classificação — não um corte real nas operações.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Tabela de subfunções ─────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>
              Detalhamento por subfunção · {year}
            </p>
            {detail.length === 0 ? (
              <p style={{ fontSize: "14px", color: "var(--text-03)" }}>Nenhum dado disponível para este exercício.</p>
            ) : (
              <div className="table-scroll">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={S.borderBottom}>
                      {[
                        "Subfunção",
                        "Empenhada",
                        "Liquidada",
                        "Paga",
                        "% do total",
                        ...(prevYear ? [`Δ vs. ${prevYear}`] : []),
                      ].map((h) => (
                        <th key={h} style={{
                          padding:   "8px 16px 8px 0",
                          textAlign: h === "Subfunção" ? "left" : "right",
                          ...S.label,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((row) => {
                      const delta = fmtDelta(row.liquidada, prevBySubfuncao[row.subfuncao])
                      return (
                        <tr key={row.subfuncao} style={S.borderBottom}>
                          <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", color: "var(--text-01)" }}>
                            <span title={SUBFUNCAO_TIPS[row.subfuncao] ?? ""}>
                              {SUBFUNCAO_LABELS[row.subfuncao] ?? row.subfuncao}
                            </span>
                            <p style={{ ...S.caption, marginTop: "2px" }}>{row.subfuncao}</p>
                          </td>
                          <NumCell value={row.empenhada} />
                          <NumCell value={row.liquidada} />
                          <NumCell value={row.paga} />
                          <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                            {total ? pct(row.liquidada, total.liquidada) : "—"}
                          </td>
                          {prevYear && (
                            <td style={{
                              padding: "14px 0 14px 0",
                              fontSize: "12px",
                              textAlign: "right",
                              fontFamily: "var(--font-ibm-plex-mono)",
                              color: delta.up === null ? "var(--text-04)" : delta.up ? "var(--text-02)" : "var(--text-03)",
                              whiteSpace: "nowrap",
                            }}>
                              {delta.text}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                  {total && (
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--border-02)" }}>
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", fontWeight: 600, color: "var(--text-01)" }}>
                          Total — Segurança Pública
                        </td>
                        <NumCell value={total.empenhada} bold />
                        <NumCell value={total.liquidada} bold />
                        <NumCell value={total.paga} bold />
                        <td style={{ padding: "14px 16px 14px 0", fontSize: "13px", textAlign: "right", color: "var(--text-03)", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          100%
                        </td>
                        {prevYear && (() => {
                          const prevTotal = prevBySubfuncao[SEGURANCA_TOTAL]
                          const delta = fmtDelta(total.liquidada, prevTotal)
                          return (
                            <td style={{
                              padding: "14px 0 14px 0",
                              fontSize: "12px",
                              textAlign: "right",
                              fontFamily: "var(--font-ibm-plex-mono)",
                              fontWeight: 600,
                              color: delta.up === null ? "var(--text-04)" : delta.up ? "var(--text-02)" : "var(--text-03)",
                            }}>
                              {delta.text}
                            </td>
                          )
                        })()}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
            <p className="mt-8" style={S.caption}>
              Fonte: DCA Anexo I-E — SICONFI / Tesouro Nacional. Sorocaba/SP · Exercício {year}.
              Dados extraídos da API pública do sistema federal.
              Liquidado = bens ou serviços entregues e aprovados pela prefeitura.
            </p>
          </div>
        </section>

        {/* ── Fonte com URL rastreável ─────────────────────────────────────── */}
        {source && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
            <div className="mx-auto px-6 py-10" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>
                Rastreabilidade · URL de origem declarada no dataset
              </p>
              <p className="mb-4" style={{ ...S.small, color: "var(--text-03)", maxWidth: "700px" }}>
                Cada linha deste relatório foi gerada a partir da seguinte URL da API SICONFI.
                O link abre o JSON bruto original; os dados aqui exibidos são filtrados para a função 06 — Segurança Pública.
              </p>
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none", wordBreak: "break-all" }}
              >
                {source}
              </a>
            </div>
          </section>
        )}

        {/* ── O que estes dados mostram / não mostram ──────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={{ ...S.h2, fontSize: "22px" }}>
                  Volume e destino por subfunção
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Quanto foi empenhado, liquidado e pago em cada subfunção da segurança pública.",
                    "Os restos a pagar inscritos ao final do exercício (processados e não processados).",
                    "A participação percentual de cada subfunção no total da função.",
                    "A variação em relação ao exercício anterior.",
                    "A URL da API oficial de onde cada dado foi extraído.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.small, color: "var(--text-02)" }}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
                <h2 className="font-light mb-6" style={{ ...S.h2, fontSize: "22px" }}>
                  Lacunas declaradas da fonte
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Dotação por subfunção — o RREO fornece apenas o total de Segurança Pública, não o detalhamento por 06.122, 06.181 etc.",
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, licitações ou processos individuais.",
                    "Efetivo em serviço, viaturas, ocorrências ou qualquer dado operacional.",
                    "Unidade executora, regional ou endereço onde o gasto ocorreu.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.small, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.caption, lineHeight: "18px" }}>
                  A dotação total (RREO Anexo 02) e a execução detalhada por subfunção (DCA Anexo I-E)
                  vêm de relatórios SICONFI distintos — por isso há dois blocos de fonte nesta página.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}

function NumCell({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td style={{
      padding:    "14px 16px 14px 0",
      fontSize:   "13px",
      textAlign:  "right",
      color:      "var(--text-02)",
      fontFamily: "var(--font-ibm-plex-mono)",
      fontWeight: bold ? 600 : 400,
      whiteSpace: "nowrap",
    }}>
      {formatPrecise(value)}
    </td>
  )
}
