import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Saúde em São Paulo — série histórica (SIOPS)",
  description:
    "Série histórica do gasto municipal em saúde de São Paulo: percentual da receita de impostos aplicado em ASPS, gasto total e cumprimento do mínimo constitucional de 15% (SIOPS).",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/saude/comparativo" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS_SIOPS = [2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

interface SiopsRow {
  ano: number
  pct: number
  total: number
  receitaImpostos: number
  pctTransferenciasSus: number
  situacao: string
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "24px", lineHeight: "32px", color: "var(--text-01)", fontWeight: 300 } as React.CSSProperties,
  h3:           { fontSize: "15px", lineHeight: "22px", color: "var(--text-01)", fontWeight: 600 } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  small:        { fontSize: "12px", lineHeight: "18px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

function parseBR(s: string): number {
  if (!s) return 0
  const c = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(c) || 0
}

function loadSiops(ano: number): SiopsRow | null {
  const f = path.join(DATA_ROOT, "sao_paulo", "saude", "saida", `siops_sao_paulo_${ano}.csv`)
  if (!fs.existsSync(f)) return null
  const lines = fs.readFileSync(f, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const h = lines[0].split(",").map((s) => s.trim().toLowerCase())
  const vals = lines[1].split(",")
  const get = (k: string) => vals[h.indexOf(k)]?.trim() ?? ""
  const sit = get("situacao")
  if (!sit || sit === "nao_coletado") return null
  return {
    ano,
    pct:                  parseFloat(get("percentual_asps")) || 0,
    total:                parseBR(get("despesa_saude_total")),
    receitaImpostos:      parseBR(get("receita_impostos")),
    pctTransferenciasSus: parseFloat(get("pct_transferencias_sus")) || 0,
    situacao:             sit,
  }
}

export default function ComparativoSaudeSaoPauloPage() {
  const rows = ANOS_SIOPS.map(loadSiops).filter((r): r is SiopsRow => r !== null).sort((a, b) => a.ano - b.ano)
  const anoMin = rows[0]?.ano
  const anoMax = rows[rows.length - 1]?.ano

  function delta(curr: number, prev: number): number | null {
    if (!prev) return null
    return ((curr - prev) / prev) * 100
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/sao-paulo/saude" style={{ ...S.small, color: "var(--text-03)", textDecoration: "none" }}>Saúde</Link>
              <span style={S.small}>/</span>
              <span style={S.small}>Série histórica</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                Saúde · São Paulo/SP{anoMin && anoMax ? ` · ${anoMin}–${anoMax}` : ""}
              </p>
              <h1 className="font-light mb-5" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Quanto São Paulo aplicou em saúde a cada ano
              </h1>
              <p style={{ ...S.body, fontSize: "15px", lineHeight: "24px", maxWidth: "640px" }}>
                Esta página reúne, ano a ano, o percentual da receita de impostos aplicado em Ações e
                Serviços Públicos de Saúde (ASPS), o gasto total e a situação de cumprimento do mínimo
                constitucional de 15% (Art. 198 CF / LC 141/2012). Os dados vêm do Sistema de Informações
                sobre Orçamentos Públicos em Saúde (SIOPS/Ministério da Saúde).
              </p>
            </div>
          </div>
        </section>

        {/* Como ler os números */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como ler os números</p>
            <h2 className="font-light mb-10" style={S.h2}>O que cada indicador significa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0" style={S.borderTop}>
              {[
                {
                  num: "01",
                  termo: "% ASPS",
                  def: "Percentual da receita de impostos e transferências constitucionais que a prefeitura aplicou em Ações e Serviços Públicos de Saúde no ano.",
                },
                {
                  num: "02",
                  termo: "Gasto total em saúde",
                  def: "Valor total, em reais, empenhado/liquidado em ASPS no ano — inclui recursos próprios do município aplicados em saúde.",
                },
                {
                  num: "03",
                  termo: "Situação",
                  def: "Se o percentual aplicado atingiu ou não o mínimo constitucional de 15% da receita de impostos, exigido pela LC 141/2012.",
                },
              ].map((item, i) => (
                <div key={item.num} className="py-8" style={{
                  paddingRight: i < 2 ? "32px" : 0,
                  paddingLeft:  i > 0 ? "32px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-mono mb-3" style={{ color: "var(--text-04)", fontSize: "12px" }}>{item.num}</p>
                  <p className="font-semibold mb-3" style={{ ...S.h3 }}>{item.termo}</p>
                  <p style={S.body}>{item.def}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Mínimo constitucional</strong> = 15% da receita
                de impostos deve ser aplicado em saúde (Art. 198 CF / LC 141/2012). Os dados abaixo exibem
                a Fase Previsto (declaração municipal) do SIOPS, referência oficial de conformidade.
              </p>
            </div>
            <div className="mt-4 p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Anomalia nos dados de origem:</strong> o campo
                &quot;gasto por habitante&quot; (despesa_saude_por_hab) retornado pelo SIOPS para São Paulo
                traz valores agregados maiores que a própria despesa total em saúde — logicamente
                incompatíveis com um valor por habitante (ex.: em 2020, o campo registra R$ 10,57 bi,
                acima dos R$ 7,50 bi de despesa total). O mesmo padrão aparece nos dados SIOPS de Paulínia.
                Por isso, esse campo não é exibido nesta página — divulgar um número que não bate com sua
                própria definição seria publicar estatística sem fonte confiável.
              </p>
            </div>
          </div>
        </section>

        {/* Série histórica — tabela */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>
              Série histórica{anoMin && anoMax ? ` · ${anoMin}–${anoMax}` : ""}
            </p>
            <h2 className="font-light mb-3" style={S.h2}>Aplicação em saúde por ano — SIOPS</h2>
            <p className="mb-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Anos sem declaração no SIOPS para São Paulo não estão disponíveis e não são exibidos como
              zero — são omitidos desta série.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
                    {["Ano", "% ASPS", "Variação", "Gasto total", "Situação", "Relatório"].map((h) => (
                      <th key={h} style={{
                        textAlign: h === "Ano" ? "left" : "right",
                        padding: "10px 16px 10px 0",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.06em",
                        color: "var(--text-03)",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const prev = rows[i - 1]
                    const d = prev ? delta(row.pct, prev.pct) : null
                    const ok = row.pct >= 15
                    return (
                      <tr key={row.ano} style={{ borderBottom: "1px solid var(--border-01)" }}>
                        <td style={{ padding: "14px 16px 14px 0", color: "var(--text-01)", fontWeight: 600, fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap" }}>
                          {row.ano}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: ok ? "#24a148" : "#da1e28", fontWeight: 600 }}>
                          {fmtPct(row.pct)}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: d === null ? "var(--text-04)" : d < 0 ? "#fa4d56" : "var(--text-02)" }}>
                          {d === null ? "—" : `${d >= 0 ? "+" : ""}${fmtPct(d)}`}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-01)", whiteSpace: "nowrap" }}>
                          {fmt(row.total)}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", whiteSpace: "nowrap",
                          color: ok ? "#24a148" : "#da1e28" }}>
                          {ok ? "✓ cumprido" : "⚠ abaixo do mínimo"}
                        </td>
                        <td style={{ padding: "14px 0 14px 0", textAlign: "right" }}>
                          <Link href={`/sao-paulo/saude/relatorio/${row.ano}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none" }}>
                            Ver {row.ano} →
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

        {/* O que estes dados mostram / não mostram */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Conformidade agregada com o mínimo constitucional</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "O percentual da receita de impostos aplicado em Ações e Serviços Públicos de Saúde (ASPS) a cada ano.",
                    "O gasto total em saúde e a receita de impostos que serve de base de cálculo do percentual.",
                    "O percentual de transferências do SUS na composição do gasto.",
                    "Se o município cumpriu ou não o mínimo constitucional de 15% (LC 141/2012) em cada ano.",
                  ].map((t) => (
                    <li key={t} style={S.body}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Sem quebra por função de saúde</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Distribuição do gasto entre atenção básica, hospitalar, vigilância sanitária e demais funções — o SIOPS de São Paulo não detalha o gasto por função, ao contrário dos relatórios LRF de Sorocaba.",
                    "Gasto por habitante confiável — o campo do SIOPS para esse indicador retorna valores agregados incompatíveis com a definição de per capita (ver nota acima).",
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, notas de empenho individuais ou processos licitatórios.",
                    "Qual UBS, hospital ou unidade de saúde executou o gasto.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.body, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.small, color: "var(--text-04)" }}>
                  Essas informações não constam do SIOPS agregado de São Paulo. Caso a prefeitura publique
                  relatórios de execução detalhados por função, este site poderá incorporá-los no futuro.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  Sistema de Informações sobre Orçamentos Públicos em Saúde (SIOPS), mantido pelo Ministério
                  da Saúde, com base nas declarações do município de São Paulo (Fase Previsto).
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Os dados são consultados diretamente na API pública do SIOPS e salvos em arquivos CSV,
                  um por ano. Anos indisponíveis na API (ex.: erro HTTP ou ausência de declaração) não são
                  publicados como zero — ficam marcados como sem dado.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a href="https://siops.saude.gov.br/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    SIOPS — Ministério da Saúde →
                  </a>
                  <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Como tratamos os dados →
                  </Link>
                  <Link href="/sao-paulo/saude" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Voltar para Saúde em São Paulo →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nav para relatórios individuais */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Relatórios detalhados por ano</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...rows].reverse().map((row) => (
                <Link key={row.ano} href={`/sao-paulo/saude/relatorio/${row.ano}`}
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)", padding: "16px", textAlign: "center", textDecoration: "none" }}>
                  <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{row.ano}</p>
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
