import type { Metadata } from "next"
import Link from "next/link"
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
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { ComparativoAnos, type ComparativoPoint } from "@/components/charts/ComparativoAnos"
import { TrackedReportLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Segurança Pública",
  description: "Gastos públicos com segurança em Sorocaba: execução orçamentária e evolução anual dos investimentos com fontes oficiais.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/seguranca" },
}

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

  const latestOrcamento = latestYear ? loadSegurancaOrcamento(latestYear) : null
  const taxaExecucaoLatest = latestOrcamento && latestOrcamento.dotacao_atualizada > 0
    ? (latestOrcamento.empenhado / latestOrcamento.dotacao_atualizada) * 100
    : null

  const chartYears = [...years].reverse()

  // Load all years once — used for both charts
  const allYearRows: Record<number, ReturnType<typeof loadSegurancaData>> = {}
  for (const year of chartYears) {
    allYearRows[year] = loadSegurancaData(year)
  }

  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => ({
    year: String(year),
    total: allYearRows[year]?.find((r) => r.subfuncao === SEGURANCA_TOTAL)?.liquidada ?? 0,
  }))

  const SUBFUNCOES_CHART = [
    { key: "06.181 - Policiamento",              label: "Policiamento" },
    { key: "06.122 - Administração Geral",        label: "Adm. Geral" },
    { key: "06.182 - Defesa Civil",               label: "Defesa Civil" },
    { key: "06.183 - Informação e Inteligência",  label: "Inteligência" },
  ]

  const subfuncaoChartData: ComparativoPoint[] = SUBFUNCOES_CHART.map(({ key, label }) => {
    const point: ComparativoPoint = { funcao: label }
    for (const year of chartYears) {
      point[String(year)] = allYearRows[year]?.find((r) => r.subfuncao === key)?.liquidada ?? 0
    }
    return point
  })

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
              {years.map((year) => {
                const val = allYearRows[year]?.find((r) => r.subfuncao === SEGURANCA_TOTAL)?.liquidada ?? 0
                return (
                  <TrackedReportLink
                    key={year}
                    href={`/seguranca/relatorio/${year}`}
                    area="seguranca"
                    year={year}
                    className="tile-link"
                    style={{ border: "1px solid var(--border-01)", borderRadius: "8px" }}
                  >
                    <div style={{ padding: "20px" }}>
                      <p style={S.label}>{year}</p>
                      <p className="mt-2 font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                        {val > 0 ? formatMillions(val) : "—"}
                      </p>
                      <p style={S.caption} className="mt-1">liquidado</p>
                    </div>
                  </TrackedReportLink>
                )
              })}
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
              {/* RREO orçamento + % municipal */}
              {latestOrcamento ? (
                <div className="mt-6" style={{ border: "1px solid var(--border-01)" }}>
                  <div className="px-5 py-3" style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-03)", textTransform: "uppercase" }}>
                      RREO Anexo 02 · Bimestre 6 · Orçamento e contexto municipal
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                    {[
                      { label: "Dotação atualizada",   value: formatPrecise(latestOrcamento.dotacao_atualizada) },
                      { label: "Taxa de execução",     value: taxaExecucaoLatest !== null ? `${taxaExecucaoLatest.toFixed(1)}%` : "—" },
                      { label: "% do orç. municipal",  value: latestOrcamento.pct_orcamento > 0 ? `${latestOrcamento.pct_orcamento.toFixed(2)}%` : "—" },
                      { label: "Total municipal empenhado", value: formatMillions(latestOrcamento.total_municipal_empenhado) },
                    ].map((item, i) => (
                      <div key={item.label} className="px-5 py-4" style={{ borderLeft: i > 0 ? "1px solid var(--border-01)" : "none" }}>
                        <p className="font-mono font-semibold" style={{ fontSize: "15px", color: "var(--text-01)" }}>{item.value}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-04)", marginTop: "4px" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      Fonte: RREO Anexo 02 bimestre 6 · SICONFI. Taxa = Empenhado ÷ Dotação Atualizada.
                      % municipal = Segurança Pública / total empenhado EXCETO INTRA-ORÇAMENTÁRIAS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-5" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.body, color: "var(--text-03)" }}>
                    <strong style={{ color: "var(--text-01)" }}>Nota metodológica:</strong> o DCA Anexo I-E não registra dotação orçamentária.
                    O valor pago foi{" "}
                    {total.liquidada > 0
                      ? `${((total.paga / total.liquidada) * 100).toFixed(1)}% do valor liquidado`
                      : "não disponível"}{" "}
                    em {latestYear}.
                  </p>
                </div>
              )}
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
              <div style={{ padding: "28px", border: "1px solid var(--border-01)", gridColumn: "span 2" } as React.CSSProperties}>
                <p className="uppercase font-semibold mb-3" style={S.label}>Comparativo de subfunções</p>
                <ComparativoAnos data={subfuncaoChartData} years={chartYears} />
              </div>
            </div>
            <div className="mt-10 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }}>
              <div>
                <p style={{ fontSize: "14px", color: "var(--text-02)" }}>
                  Série histórica completa com variação ano a ano e distribuição por subfunção.
                  Nota: em 2020–2021 a subfunção Administração Geral não estava declarada separadamente.
                </p>
              </div>
              <Link href="/seguranca/comparativo"
                style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "24px" }}>
                Ver série {yearRange} completa →
              </Link>
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
                  texto: "Saúde e educação usam PDFs quadrimestrais da Prefeitura de Sorocaba, com mínimos constitucionais. Segurança usa dois relatórios federais SICONFI (DCA Anexo I-E + RREO Anexo 02), com frequência anual e sem mínimo constitucional.",
                },
                {
                  titulo: "O que esta fonte não mostra",
                  texto: "Dotação por subfunção, fornecedor, contrato, nota fiscal, ocorrência policial, efetivo em serviço ou unidade operacional. O RREO fornece dotação apenas para o total da função — não por subfunção.",
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
                <>
                  <a
                    href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio=${latestYear}&id_ente=3552205`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}
                  >
                    API DCA Anexo I-E — {latestYear} →
                  </a>
                  <a
                    href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${latestYear}&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2002&id_ente=3552205`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}
                  >
                    API RREO Anexo 02 — {latestYear} →
                  </a>
                </>
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
