import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsSeguranca,
  loadSegurancaData,
  SUBFUNCAO_LABELS,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { TrackedReportLink } from "@/components/analytics/tracked-link"

const SEGURANCA_TOTAL = "06 - Segurança Pública"

const SUBFUNCAO_DESCRICOES: Record<string, string> = {
  "06.122 - Administração Geral":
    "Salários e custos operacionais da Guarda Municipal: gestão, recursos humanos, equipamentos de suporte e serviços administrativos.",
  "06.181 - Policiamento":
    "Operações de patrulhamento, atendimento de ocorrências, vigilância de espaços públicos e ações de segurança urbana.",
  "06.182 - Defesa Civil":
    "Resposta a emergências e desastres naturais, monitoramento de riscos e apoio à população em situações de vulnerabilidade.",
  "06.183 - Informação e Inteligência":
    "Análise de dados, monitoramento e inteligência operacional para apoio às ações de segurança pública municipal.",
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
  small: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

export default function SegurancaPage() {
  const years = getAvailableYearsSeguranca()
  const latestYear = years[0]
  const latestRows = latestYear ? loadSegurancaData(latestYear) : []
  const total = latestRows.find((r) => r.subfuncao === SEGURANCA_TOTAL)
  const subfuncoes = latestRows.filter((r) => r.subfuncao !== SEGURANCA_TOTAL)
  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const chartYears = [...years].reverse()
  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => {
    const rows = loadSegurancaData(year)
    const tot = rows.find((r) => r.subfuncao === SEGURANCA_TOTAL)
    return { year: String(year), total: tot?.liquidada ?? 0 }
  })

  const totalVariacao =
    totalAnualData.length > 1 && totalAnualData[0].total > 0
      ? (((totalAnualData[totalAnualData.length - 1].total - totalAnualData[0].total) / totalAnualData[0].total) * 100).toFixed(0)
      : null

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Segurança Pública em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                Acompanhe as despesas anuais da Guarda Municipal, policiamento, defesa civil e inteligência,
                com base no DCA Anexo I-E do SICONFI.
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Segurança Pública · {yearRange}
              </p>
            </div>
          </div>
        </section>

        {/* ── Relatórios disponíveis ────────────────────────────────────────── */}
        <section id="consultar" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Relatórios disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {years.map((year) => (
                <TrackedReportLink
                  key={year}
                  href={`/seguranca/relatorio/${year}`}
                  area="seguranca"
                  year={year}
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)" }}
                >
                  <div className="p-6 flex flex-col gap-4 h-full">
                    <p className="font-mono uppercase mb-1" style={{ fontSize: "11px", color: "var(--text-03)" }}>Sorocaba / SP</p>
                    <p className="font-mono font-medium" style={{ fontSize: "36px", color: "var(--text-01)" }}>{year}</p>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "#005d5d", border: "1px solid #005d5d", borderRadius: "2px", padding: "1px 6px" }}>SEGURANÇA</span>
                    <div className="mt-auto flex items-center gap-2" style={{ color: "#005d5d", fontSize: "13px" }}>Ver relatório</div>
                  </div>
                </TrackedReportLink>
              ))}
            </div>
          </div>
        </section>

        {/* ── Sticky nav ───────────────────────────────────────────────────── */}
        <nav style={{ ...S.borderBottom, backgroundColor: "var(--bg-base)", position: "sticky", top: "48px", zIndex: 10 }}>
          <div className="mx-auto px-6 py-2 section-tabs" style={{ ...S.container, alignItems: "center", gap: "32px" }}>
            {[
              { id: "consultar",   label: "Relatórios" },
              { id: "indicadores", label: "Último ano" },
              { id: "distribuicao", label: "Distribuição" },
              { id: "graficos",    label: "Histórico" },
              { id: "fonte",       label: "Fonte" },
            ].map(item => (
              <a key={item.id} href={`#${item.id}`} style={{ ...S.label, color: "var(--text-01)", textDecoration: "none", fontSize: "12px" }} className="hover:opacity-70">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Indicadores — último ano ─────────────────────────────────────── */}
        {total && (
          <section id="indicadores" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-2" style={S.label}>
                Último ano disponível · {latestYear} · Exercício completo · DCA Anexo I-E
              </p>
              <h2 className="font-light mb-8" style={S.h2}>
                Como o orçamento de segurança foi executado
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
                {([
                  {
                    label: "Empenhada",
                    value: total.empenhada,
                    note: "Valor para o qual a prefeitura firmou compromissos formais de pagamento com fornecedores.",
                  },
                  {
                    label: "Liquidada",
                    value: total.liquidada,
                    note: "Bens e serviços recebidos e aprovados pela prefeitura — o gasto está comprovado.",
                  },
                  {
                    label: "Paga",
                    value: total.paga,
                    note: "Valor efetivamente transferido ao fornecedor. Dinheiro que saiu do caixa da prefeitura.",
                  },
                  {
                    label: "Restos a pagar",
                    value: total.restos_nao_processados + total.restos_processados,
                    note: "Despesas inscritas em restos a pagar ao final do exercício (processados + não processados).",
                  },
                ] as const).map((item, i) => (
                  <div key={item.label} className="py-8" style={{
                    paddingRight: i < 3 ? "32px" : 0,
                    paddingLeft:  i > 0 ? "32px" : 0,
                    borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}>
                    <p className="font-mono font-medium mb-1" style={{ fontSize: "clamp(18px, 2.5vw, 26px)", lineHeight: "1.1", color: "var(--text-01)" }}>
                      {formatMillions(item.value)}
                    </p>
                    <p className="font-mono mb-3" style={S.caption}>{formatPrecise(item.value)}</p>
                    <p className="font-semibold mb-2" style={{ color: "var(--text-03)", fontSize: "12px" }}>{item.label}</p>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-5" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                <p style={{ ...S.body, color: "var(--text-03)" }}>
                  <strong style={{ color: "var(--text-01)" }}>Nota metodológica:</strong> o DCA Anexo I-E não registra dotação orçamentária.
                  Por isso, não é possível calcular a taxa de execução (pago ÷ dotação) da mesma forma que em saúde e educação.
                  O valor pago foi{" "}
                  {total.liquidada > 0
                    ? `${((total.paga / total.liquidada) * 100).toFixed(1)}% do valor liquidado`
                    : "não disponível"}{" "}
                  em {latestYear}.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Distribuição por subfunção ───────────────────────────────────── */}
        <section id="distribuicao" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>
              Distribuição · {latestYear} · Por subfunção
            </p>
            <h2 className="font-light mb-3" style={S.h2}>Onde o dinheiro foi</h2>
            <p className="mb-10" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Cada subfunção representa uma linha de atividade da segurança pública municipal registrada no DCA.
              Os percentuais são calculados sobre o total liquidado da função.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {subfuncoes.map((row) => {
                const pct = total && total.liquidada > 0
                  ? ((row.liquidada / total.liquidada) * 100).toFixed(1)
                  : null
                return (
                  <div key={row.subfuncao} style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                    <p className="uppercase font-semibold mb-3" style={S.label}>
                      {SUBFUNCAO_LABELS[row.subfuncao] ?? row.subfuncao}
                    </p>
                    <p className="font-mono text-4xl" style={{ color: "var(--text-01)", marginBottom: "8px" }}>
                      {formatMillions(row.liquidada)}
                    </p>
                    {pct && (
                      <p className="font-mono mb-4" style={{ fontSize: "12px", color: "var(--text-04)" }}>
                        {pct}% do total liquidado
                      </p>
                    )}
                    <p style={S.body}>{SUBFUNCAO_DESCRICOES[row.subfuncao] ?? row.subfuncao}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Gráficos ─────────────────────────────────────────────────────── */}
        <section id="graficos" style={{ backgroundColor: "var(--bg-base)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Total liquidado por ano</p>
                <TotalAnual data={totalAnualData} />
              </div>
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Variação acumulada</p>
                <p className="font-mono text-3xl" style={{ color: "var(--text-01)", marginBottom: "16px" }}>
                  {totalVariacao !== null ? `+${totalVariacao}%` : "—"}
                </p>
                <p style={S.body}>
                  Crescimento do gasto liquidado de {chartYears[0] ?? "—"} a {chartYears[chartYears.length - 1] ?? "—"},
                  medido pelo valor liquidado anual.
                </p>
              </div>
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Série histórica completa</p>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Comparativo entre os anos disponíveis com variação ano a ano e distribuição por subfunção.
                </p>
                <Link href="/seguranca/comparativo" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                  Ver série {yearRange} completa →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fonte e verificação ──────────────────────────────────────────── */}
        <section id="fonte" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {([
                {
                  titulo: "Documento de origem",
                  texto: "DCA Anexo I-E (Declaração de Contas Anuais) do SICONFI — Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro, mantido pelo Tesouro Nacional.",
                },
                {
                  titulo: "Como difere de saúde e educação",
                  texto: "Saúde e educação usam PDFs quadrimestrais da Prefeitura de Sorocaba. Segurança usa a API federal do SICONFI, com frequência anual, sem mínimo constitucional e sem registro de dotação.",
                },
                {
                  titulo: "O que esta fonte não mostra",
                  texto: "Dotação autorizada, fornecedor, contrato, nota fiscal, ocorrência policial, efetivo em serviço ou unidade operacional. Esses dados existem em outros sistemas — não no DCA.",
                },
              ] as const).map((item, i) => (
                <div key={item.titulo} className="py-8" style={{
                  paddingRight: i < 2 ? "32px" : 0,
                  paddingLeft:  i > 0 ? "32px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-semibold mb-3" style={{ color: "var(--text-01)", fontSize: "13px" }}>{item.titulo}</p>
                  <p style={S.body}>{item.texto}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4">
              {latestYear && (
                <a
                  href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio=${latestYear}&id_ente=3552205`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}
                >
                  Consultar API SICONFI — DCA {latestYear} →
                </a>
              )}
              <Link href="/dados" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                Baixar os CSVs publicados →
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
