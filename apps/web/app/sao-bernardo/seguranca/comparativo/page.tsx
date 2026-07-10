import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsSeguranca,
  loadSegurancaData,
  loadSegurancaOrcamento,
  SUBFUNCAO_LABELS,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { ComparativoAnos, type ComparativoPoint } from "@/components/charts/ComparativoAnos"

const MUNICIPIO = "sao_bernardo"
const IBGE = "3548708"
const SEGURANCA_TOTAL = "06 - Segurança Pública"
const RESIDUAL_KEY = "__residual__"

// Ordem fixa para colunas consistentes na tabela/gráfico. 06.999 só aparece
// declarada em 2015-2016; nos demais anos o resíduo é calculado (ver RESIDUAL_KEY).
const ALL_SUBFUNCOES = [
  "06.181 - Policiamento",
  "06.122 - Administração Geral",
  "06.182 - Defesa Civil",
  "06.183 - Informação e Inteligência",
  "06.999 - Demais Subfunções Segurança Pública",
] as const

const SUBFUNCAO_EXPLICACOES: Record<string, string> = {
  "06.181 - Policiamento":
    "Guarda Civil Municipal: patrulhamento, atendimento de ocorrências e vigilância de espaços públicos. Concentra historicamente entre 63% e 91% do total liquidado.",
  "06.122 - Administração Geral":
    "Custos administrativos e de gestão da segurança pública municipal. Não declarada separadamente em 2015 — nesse ano está incluída no resíduo não detalhado.",
  "06.182 - Defesa Civil":
    "Resposta a emergências e desastres naturais, monitoramento de riscos e apoio à população em situações de vulnerabilidade. Presente em todos os exercícios.",
  "06.183 - Informação e Inteligência":
    "Análise de dados, monitoramento e inteligência operacional. Não declarada separadamente em 2017 — nesse ano está incluída no resíduo não detalhado.",
  "06.999 - Demais Subfunções Segurança Pública":
    "Subfunção residual declarada explicitamente pelo DCA em 2015 e 2016. A partir de 2017, o DCA para de declarar 06.999 mas a soma das subfunções detalhadas continua menor que o total da função — ver nota metodológica abaixo.",
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
    fontSize: "24px",
    lineHeight: "32px",
    color: "var(--text-01)",
    fontWeight: 300,
  } as React.CSSProperties,
  h3: {
    fontSize: "15px",
    lineHeight: "22px",
    color: "var(--text-01)",
    fontWeight: 600,
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  small: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmtMi(v: number): string {
  const m = v / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
}

function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

function delta(curr: number, prev: number): number {
  if (!prev) return 0
  return ((curr - prev) / prev) * 100
}

export const metadata: Metadata = {
  title: "Segurança em São Bernardo do Campo — série histórica",
  description:
    "Série histórica das despesas em segurança pública de São Bernardo do Campo: evolução anual de dotação, empenho, liquidação e pagamento por subfunção. Fonte: DCA Anexo I-E e RREO Anexo 02 — SICONFI.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-bernardo/seguranca/comparativo" },
}

export default function ComparativoSegurancaPage() {
  const years = getAvailableYearsSeguranca(MUNICIPIO).reverse() // crescente: 2015, 2016…

  type YearRow = {
    year: number
    liquidada: number
    paga: number
    subfuncoes: Record<string, number>
    residual: number
    dotacao_atualizada: number
    taxa_execucao: number | null
    pct_orcamento: number
  }

  const rows: YearRow[] = years.map((year) => {
    const data = loadSegurancaData(year, MUNICIPIO)
    const total = data.find((r) => r.subfuncao === SEGURANCA_TOTAL)
    const declared = data.filter((r) => r.subfuncao !== SEGURANCA_TOTAL)
    const sfMap: Record<string, number> = {}
    for (const sf of ALL_SUBFUNCOES) {
      sfMap[sf] = declared.find((r) => r.subfuncao === sf)?.liquidada ?? 0
    }
    const declaredSum = declared.reduce((acc, r) => acc + r.liquidada, 0)
    const totalLiq = total?.liquidada ?? 0
    const residual = totalLiq - declaredSum
    const orcamento = loadSegurancaOrcamento(year, MUNICIPIO)
    const dotacao = orcamento?.dotacao_atualizada ?? 0
    const emp = total?.empenhada ?? 0
    return {
      year,
      liquidada: totalLiq,
      paga:      total?.paga      ?? 0,
      subfuncoes: sfMap,
      residual: residual > 1 ? residual : 0,
      dotacao_atualizada: dotacao,
      taxa_execucao: dotacao > 0 ? (emp / dotacao) * 100 : null,
      pct_orcamento: orcamento?.pct_orcamento ?? 0,
    }
  })

  const chartYears = [...years]
  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => {
    const row = rows.find((r) => r.year === year)
    return { year: String(year), total: row?.liquidada ?? 0 }
  })

  const SUBFUNCOES_CHART = [
    { key: "06.181 - Policiamento",              label: "Policiamento" },
    { key: "06.122 - Administração Geral",        label: "Adm. Geral" },
    { key: "06.182 - Defesa Civil",               label: "Defesa Civil" },
    { key: "06.183 - Informação e Inteligência",  label: "Inteligência" },
    { key: RESIDUAL_KEY,                          label: "Não detalhado" },
  ] as const

  const subfuncaoChartData: ComparativoPoint[] = SUBFUNCOES_CHART.map(({ key, label }) => {
    const point: ComparativoPoint = { funcao: label }
    for (const row of rows) {
      point[String(row.year)] = key === RESIDUAL_KEY ? row.residual : (row.subfuncoes[key] ?? 0)
    }
    return point
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/sao-bernardo/seguranca" style={{ ...S.small, color: "var(--text-03)", textDecoration: "none" }}>Segurança</Link>
              <span style={S.small}>/</span>
              <span style={S.small}>Série histórica</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--purple-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                Segurança Pública · São Bernardo do Campo/SP · {years[0]}–{years[years.length - 1]}
              </p>
              <h1 className="font-light mb-5" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Quanto São Bernardo do Campo gastou em segurança pública a cada ano
              </h1>
              <p style={{ ...S.body, fontSize: "15px", lineHeight: "24px", maxWidth: "640px" }}>
                Esta página reúne a despesa anual em segurança pública de {years[0]} a {years[years.length - 1]},
                com a distribuição por subfunção e a variação de um exercício para o outro.
                Os dados vêm do DCA Anexo I-E publicado no sistema federal SICONFI — não dos relatórios municipais
                usados em saúde e educação.
              </p>
            </div>
          </div>
        </section>

        {/* ── Como ler os números ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como ler os números</p>
            <h2 className="font-light mb-10" style={S.h2}>
              O que o DCA registra e o que ele não registra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={S.borderTop}>
              {[
                {
                  num: "01",
                  termo: "Empenhada",
                  def: "Valor para o qual a prefeitura firmou compromisso formal de pagamento. O serviço ou fornecimento pode ainda não ter sido entregue.",
                },
                {
                  num: "02",
                  termo: "Liquidada",
                  def: "Bens ou serviços efetivamente recebidos e aprovados pela prefeitura. É a coluna usada na série histórica abaixo.",
                },
                {
                  num: "03",
                  termo: "Paga",
                  def: "Valor transferido ao fornecedor. Pode ser ligeiramente menor que o liquidado se parte ficou inscrita em restos a pagar processados.",
                },
                {
                  num: "04",
                  termo: "Dotação (RREO)",
                  def: "O DCA não registra dotação, mas o RREO Anexo 02 bimestre 6 sim. A taxa de execução nesta página usa Empenhado ÷ Dotação Atualizada do RREO — válida para o total da função, não por subfunção.",
                },
              ].map((item, i) => (
                <div key={item.num} className="py-8" style={{
                  paddingRight: i < 3 ? "32px" : 0,
                  paddingLeft:  i > 0 ? "32px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-mono mb-3" style={{ color: "var(--text-04)", fontSize: "12px" }}>{item.num}</p>
                  <p className="font-semibold mb-3" style={S.h3}>{item.termo}</p>
                  <p style={S.body}>{item.def}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Consistência entre fontes:</strong>{" "}
                em São Bernardo do Campo, o Empenhado e o Liquidado totais do DCA Anexo I-E coincidem
                exatamente com o Empenhado e o Liquidado EXCETO INTRA-ORÇAMENTÁRIAS do RREO Anexo 02 em
                todos os {years.length} exercícios publicados ({years[0]}–{years[years.length - 1]}) — não há
                divergência de consolidação intra-orçamentária como observado em outros municípios.
              </p>
            </div>
          </div>
        </section>

        {/* ── Gráfico histórico ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-3" style={S.label}>
                  Total liquidado · {years[0]}–{years[years.length - 1]}
                </p>
                <TotalAnual data={totalAnualData} />
              </div>
              <div style={{ padding: "28px", border: "1px solid var(--border-01)" }}>
                <p className="uppercase font-semibold mb-1" style={S.label}>
                  Comparativo de subfunções
                </p>
                <p className="mb-3" style={{ ...S.small, color: "var(--text-04)" }}>
                  &ldquo;Não detalhado&rdquo; é a diferença entre o total da função 06 e a soma das subfunções
                  declaradas pelo DCA naquele exercício — não é uma subfunção real.
                </p>
                <ComparativoAnos data={subfuncaoChartData} years={chartYears} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Série histórica tabela ───────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>
              Série histórica · {years[0]}–{years[years.length - 1]}
            </p>
            <h2 className="font-light mb-3" style={S.h2}>Total liquidado em segurança pública por ano</h2>
            <p className="mb-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Exercício completo (Jan–Dez). O valor liquidado representa bens e serviços
              efetivamente entregues e aprovados — é a coluna mais comparável entre anos.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
                    {["Ano", "Dotação Atual.", "Taxa execução", "Liquidado", "Variação", "% Mun.", "Relatório"].map((h) => (
                      <th key={h} style={{
                        textAlign:    h === "Ano" ? "left" : "right",
                        padding:      "10px 16px 10px 0",
                        fontWeight:   600,
                        fontSize:     "11px",
                        letterSpacing: "0.06em",
                        color:        "var(--text-03)",
                        textTransform: "uppercase",
                        whiteSpace:   "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const prev = rows[i - 1]
                    const d = prev ? delta(row.liquidada, prev.liquidada) : null
                    return (
                      <tr key={row.year} style={{ borderBottom: "1px solid var(--border-01)" }}>
                        <td style={{ padding: "14px 16px 14px 0", color: "var(--text-01)", fontWeight: 600, fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap" }}>
                          {row.year}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-03)", whiteSpace: "nowrap" }}>
                          {row.dotacao_atualizada > 0 ? fmtMi(row.dotacao_atualizada) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: row.taxa_execucao === null ? "var(--text-04)" : row.taxa_execucao >= 85 ? "#42be65" : row.taxa_execucao < 70 ? "#fa4d56" : "var(--text-02)" }}>
                          {row.taxa_execucao !== null ? fmtPct(row.taxa_execucao) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-01)", whiteSpace: "nowrap" }}>
                          {row.liquidada > 0 ? fmtMi(row.liquidada) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: d === null ? "var(--text-04)" : d < 0 ? "#fa4d56" : d > 15 ? "#42be65" : "var(--text-02)" }}>
                          {d === null ? "—" : `${d >= 0 ? "+" : ""}${fmtPct(d)}`}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-03)", whiteSpace: "nowrap" }}>
                          {row.pct_orcamento > 0 ? fmtPct(row.pct_orcamento, 2) : "—"}
                        </td>
                        <td style={{ padding: "14px 0 14px 0", textAlign: "right" }}>
                          <Link href={`/sao-bernardo/seguranca/relatorio/${row.year}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none" }}>
                            Ver {row.year} →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Nota metodológica: subfunções não detalhadas ─────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="p-6" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", borderLeft: "4px solid #f1c21b" }}>
              <p className="font-semibold mb-3" style={{ color: "var(--text-01)", fontSize: "14px" }}>
                Parte do gasto não é detalhada por subfunção em todos os anos
              </p>
              <p className="mb-3" style={{ ...S.body, color: "var(--text-03)" }}>
                Em 2015 e 2016, o DCA declarou explicitamente a subfunção residual 06.999 (Demais Subfunções
                Segurança Pública), cobrindo a parcela do gasto não atribuída a nenhuma linha específica.
                A partir de 2017, o DCA para de declarar 06.999 — mas a soma das subfunções detalhadas
                (Policiamento, Administração Geral, Defesa Civil, Informação e Inteligência) continua menor
                que o total liquidado da função 06 em todos os exercícios seguintes.
              </p>
              <p className="mb-3" style={{ ...S.body, color: "var(--text-03)" }}>
                Essa diferença não detalhada varia de {fmtPct(2.5)} do total em 2019 a {fmtPct(20.7)} em 2017,
                e fica entre {fmtPct(2.5)} e {fmtPct(9.6)} na maior parte da série. Ela está representada nas
                tabelas e gráficos desta página e do relatório de cada ano como &ldquo;não detalhado&rdquo;.
              </p>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Interpretação defensável:</strong> o total liquidado
                da função 06 é confiável e bate exatamente com o RREO Anexo 02 em todos os anos. A parcela não
                detalhada por subfunção é uma lacuna declarada da fonte, não um erro de extração — o DCA
                simplesmente não atribui esse valor a nenhuma subfunção específica nesses exercícios.
              </p>
            </div>
          </div>
        </section>

        {/* ── Distribuição por subfunção — uma seção por ano ──────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Onde foi cada real</p>
            <h2 className="font-light mb-3" style={S.h2}>
              Distribuição por subfunção · exercício completo
            </h2>
            <p className="mb-10" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Cada linha mostra o valor liquidado em cada subfunção e a participação no total daquele ano.
              &ldquo;—&rdquo; indica que a subfunção não foi declarada no DCA daquele exercício.
            </p>

            <div className="flex flex-col gap-0" style={S.borderTop}>
              {rows.map((row) => (
                <div key={row.year} className="py-10" style={S.borderBottom}>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-mono font-semibold" style={{ fontSize: "28px", color: "var(--text-01)" }}>{row.year}</span>
                    <span style={{ ...S.body, color: "var(--text-03)" }}>Total liquidado: {fmtMi(row.liquidada)}</span>
                    <Link href={`/sao-bernardo/seguranca/relatorio/${row.year}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none", marginLeft: "auto" }}>
                      Relatório completo →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0" style={S.borderTop}>
                    {ALL_SUBFUNCOES.map((sf) => {
                      const v = row.subfuncoes[sf] ?? 0
                      const pct = row.liquidada > 0 ? (v / row.liquidada) * 100 : 0
                      const notDeclared = v === 0
                      return (
                        <div key={sf} className="py-5 pr-6" style={S.borderBottom}>
                          <p style={{ ...S.small, color: "var(--text-03)", marginBottom: "4px" }}>
                            {SUBFUNCAO_LABELS[sf] ?? sf}
                          </p>
                          <p className="font-mono" style={{ fontSize: "16px", color: notDeclared ? "var(--text-04)" : "var(--text-01)" }}>
                            {notDeclared ? "—" : fmtMi(v)}
                          </p>
                          {v > 0 && (
                            <p style={{ ...S.small, marginTop: "2px" }}>{fmtPct(pct)} do total</p>
                          )}
                        </div>
                      )
                    })}
                    <div className="py-5 pr-6" style={S.borderBottom}>
                      <p style={{ ...S.small, color: "var(--text-03)", marginBottom: "4px" }}>Não detalhado</p>
                      <p className="font-mono" style={{ fontSize: "16px", color: row.residual > 0 ? "var(--text-02)" : "var(--text-04)" }}>
                        {row.residual > 0 ? fmtMi(row.residual) : "—"}
                      </p>
                      {row.residual > 0 && (
                        <p style={{ ...S.small, marginTop: "2px" }}>
                          {fmtPct(row.liquidada > 0 ? (row.residual / row.liquidada) * 100 : 0)} do total
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── O que cada subfunção cobre ───────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>O que cada subfunção cobre</p>
            <h2 className="font-light mb-10" style={S.h2}>Explicação e comportamento histórico</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {ALL_SUBFUNCOES.map((sf, i) => (
                <div key={sf} className="py-8" style={{
                  paddingRight: i % 2 === 0 ? "48px" : 0,
                  paddingLeft:  i % 2 === 1 ? "48px" : 0,
                  borderLeft:   i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-semibold mb-1" style={S.h3}>{SUBFUNCAO_LABELS[sf] ?? sf}</p>
                  <p className="font-mono mb-3" style={{ fontSize: "11px", color: "var(--text-04)" }}>{sf}</p>
                  <p style={S.body}>{SUBFUNCAO_EXPLICACOES[sf] ?? ""}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── O que estes dados mostram / não mostram ──────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Série histórica auditável</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Quanto foi empenhado, liquidado e pago em segurança pública a cada ano.",
                    "A distribuição do gasto por subfunção em cada exercício, quando declarada.",
                    "A parcela do gasto não atribuída a nenhuma subfunção específica pelo DCA.",
                    "A variação percentual de um ano para o outro.",
                    "A URL da API SICONFI de onde cada dado foi extraído, por exercício.",
                  ].map((t) => (
                    <li key={t} style={S.body}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Lacunas declaradas da fonte</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Dotação por subfunção — o RREO fornece apenas o total da função 06, não o detalhamento por 06.122, 06.181 etc.",
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, licitações ou processos individuais.",
                    "Efetivo em serviço, viaturas ou qualquer indicador operacional.",
                    "A que subfunção pertence a parcela não detalhada de 2017 em diante.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.body, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.small, color: "var(--text-04)" }}>
                  O DCA é uma declaração contábil anual. Dados operacionais de segurança existem em outros
                  sistemas, como boletins de ocorrência e relatórios de atividade da Guarda Civil Municipal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fonte ────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  DCA Anexo I-E (Declaração de Contas Anuais) do SICONFI, mantido pelo Tesouro Nacional.
                  Publicação anual após encerramento do exercício fiscal.
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Um script Python consulta a API pública do SICONFI, salva o JSON bruto e filtra
                  a função 06 — Segurança Pública. O JSON original é preservado localmente antes
                  da geração dos CSVs publicados.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a
                    href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio=${years[years.length - 1]}&id_ente=${IBGE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}
                  >
                    API DCA Anexo I-E — {years[years.length - 1]} →
                  </a>
                  <a
                    href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${years[years.length - 1]}&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2002&id_ente=${IBGE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}
                  >
                    API RREO Anexo 02 — {years[years.length - 1]} →
                  </a>
                  <Link href="/sao-bernardo" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    ← São Bernardo do Campo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Nav para relatórios individuais ──────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Relatórios detalhados por ano</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...rows].reverse().map((row) => (
                <Link
                  key={row.year}
                  href={`/sao-bernardo/seguranca/relatorio/${row.year}`}
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)", padding: "16px", textAlign: "center", textDecoration: "none" }}
                >
                  <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{row.year}</p>
                  <p style={{ ...S.small, marginTop: "4px" }}>Ver relatório</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
