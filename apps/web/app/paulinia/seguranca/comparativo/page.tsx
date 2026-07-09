import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsSegurancaOrcamento,
  loadSegurancaOrcamento,
  type SegurancaOrcamentoRow,
} from "@/lib/data"

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
  title: "Segurança em Paulínia — série histórica",
  description:
    "Série histórica das despesas em segurança pública de Paulínia: evolução anual de dotação, empenho, liquidação e percentual do orçamento municipal. Fonte: RREO Anexo 02 — SICONFI/Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia/seguranca/comparativo" },
}

export default function ComparativoSegurancaPauliniaPage() {
  const years = getAvailableYearsSegurancaOrcamento("paulinia").reverse() // crescente: 2020, 2021…

  type YearRow = SegurancaOrcamentoRow & { year: number; taxa_execucao: number | null }

  const rows: YearRow[] = years
    .map((year) => {
      const orcamento = loadSegurancaOrcamento(year, "paulinia")
      if (!orcamento) return null
      const taxa = orcamento.dotacao_atualizada > 0
        ? (orcamento.empenhado / orcamento.dotacao_atualizada) * 100
        : null
      return { ...orcamento, year, taxa_execucao: taxa }
    })
    .filter((r): r is YearRow => r !== null)

  const firstYear = years[0]
  const lastYear = years[years.length - 1]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/paulinia/seguranca" style={{ ...S.small, color: "var(--text-03)", textDecoration: "none" }}>Segurança</Link>
              <span style={S.small}>/</span>
              <span style={S.small}>Série histórica</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--purple-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                Segurança Pública · Paulínia/SP · {firstYear}–{lastYear}
              </p>
              <h1 className="font-light mb-5" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Quanto Paulínia gastou em segurança pública a cada ano
              </h1>
              <p style={{ ...S.body, fontSize: "15px", lineHeight: "24px", maxWidth: "640px" }}>
                Esta página reúne a despesa anual em segurança pública de {firstYear} a {lastYear}:
                dotação, empenho, liquidação e o percentual que a área representou no orçamento
                municipal total. Os dados vêm do RREO Anexo 02, publicado pelo Tesouro Nacional
                no sistema federal SICONFI.
              </p>
              <div className="p-4 mt-6" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.small, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota de cobertura:</strong>{" "}
                  Para Paulínia, o detalhamento por subfunção (Policiamento, Defesa Civil, Administração
                  Geral) ainda não está disponível. A página exibe apenas os totais anuais da função
                  Segurança Pública, conforme o RREO Anexo 02.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como ler os números ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como ler os números</p>
            <h2 className="font-light mb-10" style={S.h2}>
              O que o RREO registra
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={S.borderTop}>
              {[
                {
                  num: "01",
                  termo: "Dotação atualizada",
                  def: "Orçamento fixado na LOA, já ajustado por créditos adicionais e suplementações ao longo do exercício.",
                },
                {
                  num: "02",
                  termo: "Empenhado",
                  def: "Valor para o qual a prefeitura firmou compromisso formal de pagamento. Usado para calcular a taxa de execução.",
                },
                {
                  num: "03",
                  termo: "Liquidado",
                  def: "Bens ou serviços efetivamente recebidos e aprovados pela prefeitura. É a coluna usada na série histórica abaixo.",
                },
                {
                  num: "04",
                  termo: "% do orçamento municipal",
                  def: "Segurança pública liquidada dividida pelo total empenhado pelo município naquele exercício.",
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
                <strong style={{ color: "var(--text-01)" }}>Sobre a fonte:</strong>{" "}
                Paulínia não publica o DCA Anexo I-E (detalhamento por subfunção) para segurança pública.
                O único relatório disponível é o RREO Anexo 02 — Demonstrativo da Execução das Despesas
                por Função, do 6º bimestre de cada exercício, com o total agregado da função 06.
              </p>
            </div>
          </div>
        </section>

        {/* ── Série histórica tabela ───────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>
              Série histórica · {firstYear}–{lastYear}
            </p>
            <h2 className="font-light mb-3" style={S.h2}>Execução orçamentária em segurança pública por ano</h2>
            <p className="mb-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Exercício completo (Jan–Dez), 6º bimestre do RREO. O valor liquidado representa bens e
              serviços efetivamente entregues e aprovados — é a coluna mais comparável entre anos.
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
                    const d = prev ? delta(row.liquidado, prev.liquidado) : null
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
                          {row.liquidado > 0 ? fmtMi(row.liquidado) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: d === null ? "var(--text-04)" : d < 0 ? "#fa4d56" : d > 15 ? "#42be65" : "var(--text-02)" }}>
                          {d === null ? "—" : `${d >= 0 ? "+" : ""}${fmtPct(d)}`}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-03)", whiteSpace: "nowrap" }}>
                          {row.pct_orcamento > 0 ? fmtPct(row.pct_orcamento, 2) : "—"}
                        </td>
                        <td style={{ padding: "14px 0 14px 0", textAlign: "right" }}>
                          <Link href={`/paulinia/seguranca/relatorio/${row.year}`} style={{ fontSize: "12px", color: "var(--purple-40)", textDecoration: "none" }}>
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

        {/* ── O que estes dados mostram / não mostram ──────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Série histórica auditável</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Quanto foi fixado, atualizado, empenhado e liquidado em segurança pública a cada ano.",
                    "O percentual que a segurança pública representou no orçamento municipal total.",
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
                    "Distribuição por subfunção (Policiamento, Defesa Civil, Administração Geral) — Paulínia não publica o DCA Anexo I-E para essa função.",
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, licitações ou processos individuais.",
                    "Efetivo em serviço, viaturas ou qualquer indicador operacional.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.body, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.small, color: "var(--text-04)" }}>
                  O RREO é uma declaração contábil bimestral (registrada no 6º bimestre para o exercício
                  encerrado). Dados operacionais de segurança existem em outros sistemas.
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
                  RREO Anexo 02 (Relatório Resumido da Execução Orçamentária) do SICONFI, mantido pelo
                  Tesouro Nacional. Publicação bimestral; o 6º bimestre consolida o exercício completo.
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
                    href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${lastYear}&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2002&id_ente=3536505`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--purple-40)", textDecoration: "none" }}
                  >
                    API RREO Anexo 02 — {lastYear} →
                  </a>
                  <Link href="/paulinia/dados" style={{ fontSize: "13px", color: "var(--purple-40)", textDecoration: "none" }}>
                    Baixar os CSVs →
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
                  href={`/paulinia/seguranca/relatorio/${row.year}`}
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)", padding: "16px", textAlign: "center", textDecoration: "none" }}
                >
                  <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{row.year}</p>
                  <p style={{ ...S.small, marginTop: "4px" }}>Ver relatório</p>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link href="/paulinia/seguranca" className="nav-link">← Segurança pública</Link>
              <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
