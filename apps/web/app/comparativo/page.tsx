import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Comparativo entre municípios — Anatomia do Gasto",
  description: "Orçamento, execução e gastos per capita de Sorocaba, Paulínia e São Paulo — série histórica SICONFI 2020–2025.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/comparativo" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANO = 2025

const MUNICIPIOS_COMP = [
  { key: "sorocaba",  nome: "Sorocaba",  uf: "SP", ibge: "3552205", href: "/sorocaba",  pop: 685645,   cor: "var(--teal-60)"   },
  { key: "paulinia",  nome: "Paulínia",  uf: "SP", ibge: "3536505", href: "/paulinia",  pop: 106773,   cor: "var(--purple-60)" },
  { key: "sao_paulo", nome: "São Paulo", uf: "SP", ibge: "3550308", href: "/sao-paulo", pop: 11451245, cor: "var(--theme-accent)" },
]

interface FuncaoData {
  funcao: string
  dotacao: number
  liquidado: number
}

interface MunicipioComparativo {
  key: string
  nome: string
  uf: string
  href: string
  pop: number
  cor: string
  ano: number
  totalDotacao: number
  totalLiquidado: number
  pctExecucao: number
  funcoes: Record<string, FuncaoData>
  ok: boolean
}

function lerCSV(municipioKey: string): MunicipioComparativo {
  const m = MUNICIPIOS_COMP.find((x) => x.key === municipioKey)!
  const base: MunicipioComparativo = {
    ...m, ano: ANO,
    totalDotacao: 0, totalLiquidado: 0, pctExecucao: 0,
    funcoes: {}, ok: false,
  }

  try {
    const fp = path.join(DATA_ROOT, municipioKey, "executivo", "saida", `despesas_executivo_${municipioKey}_${ANO}.csv`)
    if (!fs.existsSync(fp)) return base

    const lines = fs.readFileSync(fp, "utf-8").split("\n").filter(Boolean)
    if (lines.length < 2) return base

    const headers = lines[0].split(",").map((h) => h.trim())
    const iFunc = headers.indexOf("Funcao")
    const iDot  = headers.indexOf("Dotacao_Atualizada")
    const iLiq  = headers.indexOf("Liquidado")
    if (iFunc < 0 || iDot < 0 || iLiq < 0) return base

    let totalDot = 0, totalLiq = 0

    for (const line of lines.slice(1)) {
      const f = line.split(",").map((s) => s.trim())
      const funcao  = f[iFunc] || ""
      const dotacao  = parseFloat(f[iDot] || "0") || 0
      const liquidado = parseFloat(f[iLiq] || "0") || 0
      if (!funcao || funcao === "TOTAL") continue
      totalDot += dotacao
      totalLiq += liquidado
      base.funcoes[funcao] = { funcao, dotacao, liquidado }
    }

    base.totalDotacao = Math.round(totalDot)
    base.totalLiquidado = Math.round(totalLiq)
    base.pctExecucao = totalDot > 0 ? Math.round((totalLiq / totalDot) * 100) : 0
    base.ok = true
  } catch {
    // arquivo inacessível — retorna base vazia
  }

  return base
}

function fmtBRL(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1).replace(".", ",")} bi`
  if (n >= 1_000_000)     return `R$ ${(n / 1_000_000).toFixed(0)} mi`
  return `R$ ${n.toLocaleString("pt-BR")}`
}

function fmtPerCap(n: number, pop: number): string {
  const v = n / pop
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")} mil/hab.`
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}/hab.`
}

function ExecBadge({ pct }: { pct: number }) {
  const cor = pct >= 85 ? "var(--support-success)" : pct >= 70 ? "var(--support-warning)" : "var(--support-error)"
  return (
    <span style={{ fontSize: "12px", color: cor, fontWeight: 600 }}>
      {pct}%
    </span>
  )
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 700, textTransform: "uppercase" } as React.CSSProperties,
  th: { fontSize: "11px", letterSpacing: "0.06em", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-04)", padding: "10px 16px", textAlign: "right" as const, whiteSpace: "nowrap" as const },
  thLeft: { fontSize: "11px", letterSpacing: "0.06em", fontWeight: 700, textTransform: "uppercase" as const, color: "var(--text-04)", padding: "10px 16px", textAlign: "left" as const },
  td: { padding: "14px 16px", textAlign: "right" as const, borderTop: "1px solid var(--border-01)", verticalAlign: "top" as const },
  tdLeft: { padding: "14px 16px", textAlign: "left" as const, borderTop: "1px solid var(--border-01)", verticalAlign: "top" as const },
  val: { fontSize: "14px", color: "var(--text-01)", fontWeight: 600, display: "block" as const, lineHeight: "1.3" },
  sub: { fontSize: "11px", color: "var(--text-04)", display: "block" as const, marginTop: "2px" },
  metrica: { fontSize: "13px", color: "var(--text-02)", lineHeight: "18px" },
  metricaSub: { fontSize: "11px", color: "var(--text-04)", marginTop: "2px" },
}

const FUNCOES_DESTAQUE = [
  { key: "Saúde",            label: "Saúde" },
  { key: "Educação",         label: "Educação" },
  { key: "Administração",    label: "Administração" },
  { key: "Assistência Social", label: "Assistência Social" },
  { key: "Segurança Pública", label: "Segurança Pública" },
  { key: "Transporte",       label: "Transporte" },
  { key: "Urbanismo",        label: "Urbanismo" },
]

export default function ComparativoPage() {
  const dados = MUNICIPIOS_COMP.map((m) => lerCSV(m.key))

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-16 md:py-20" style={S.container}>
            <p style={S.label}>Anatomia do Gasto · Comparativo</p>
            <h1
              className="font-semibold mt-3"
              style={{ fontSize: "clamp(24px, 3vw, 38px)", lineHeight: "1.15", color: "var(--text-01)", marginBottom: "12px" }}
            >
              Comparativo entre municípios
            </h1>
            <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", maxWidth: "560px", marginBottom: "20px" }}>
              Execução orçamentária {ANO} — RREO Anexo 02 / SICONFI/STN. Valores nominais (não deflacionados).
              Coleta automática às 02:00 BRT.
            </p>
            <div className="flex flex-wrap gap-2">
              {dados.map((d) => (
                <div
                  key={d.key}
                  style={{
                    padding: "6px 14px",
                    border: `1px solid ${d.cor}`,
                    fontSize: "12px",
                    color: d.cor,
                    fontWeight: 600,
                  }}
                >
                  {d.nome}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabela comparativa */}
        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.label, marginBottom: "16px" }}>Visão geral — {ANO}</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-02)" }}>
                    <th style={S.thLeft}>Métrica</th>
                    {dados.map((d) => (
                      <th key={d.key} style={{ ...S.th }}>
                        <span style={{ color: d.cor }}>{d.nome}</span>
                        <span style={{ display: "block", fontSize: "10px", color: "var(--text-04)", fontWeight: 400 }}>
                          {d.pop.toLocaleString("pt-BR")} hab.
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Orçamento total */}
                  <tr>
                    <td style={S.tdLeft}>
                      <span style={S.metrica}>Orçamento (LOA)</span>
                      <span style={S.metricaSub}>Dotação atualizada</span>
                    </td>
                    {dados.map((d) => (
                      <td key={d.key} style={S.td}>
                        {d.ok ? (
                          <>
                            <span style={S.val}>{fmtBRL(d.totalDotacao)}</span>
                            <span style={S.sub}>{fmtPerCap(d.totalDotacao, d.pop)}</span>
                          </>
                        ) : <span style={S.sub}>sem dados</span>}
                      </td>
                    ))}
                  </tr>

                  {/* Liquidado */}
                  <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <td style={S.tdLeft}>
                      <span style={S.metrica}>Gasto efetivo</span>
                      <span style={S.metricaSub}>Liquidado</span>
                    </td>
                    {dados.map((d) => (
                      <td key={d.key} style={{ ...S.td, backgroundColor: "var(--bg-elevated)" }}>
                        {d.ok ? (
                          <>
                            <span style={S.val}>{fmtBRL(d.totalLiquidado)}</span>
                            <span style={S.sub}>{fmtPerCap(d.totalLiquidado, d.pop)}</span>
                          </>
                        ) : <span style={S.sub}>sem dados</span>}
                      </td>
                    ))}
                  </tr>

                  {/* % execução */}
                  <tr>
                    <td style={S.tdLeft}>
                      <span style={S.metrica}>Execução orçamentária</span>
                      <span style={S.metricaSub}>Liquidado ÷ dotação</span>
                    </td>
                    {dados.map((d) => (
                      <td key={d.key} style={S.td}>
                        {d.ok ? <ExecBadge pct={d.pctExecucao} /> : <span style={S.sub}>—</span>}
                      </td>
                    ))}
                  </tr>

                  {/* Seção de funções */}
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        ...S.tdLeft,
                        backgroundColor: "var(--bg-elevated)",
                        borderTop: "2px solid var(--border-02)",
                        paddingTop: "10px",
                        paddingBottom: "6px",
                      }}
                    >
                      <span style={S.label}>Gasto por função — liquidado</span>
                    </td>
                  </tr>

                  {FUNCOES_DESTAQUE.map((fn, i) => (
                    <tr key={fn.key} style={{ backgroundColor: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)" }}>
                      <td style={{ ...S.tdLeft, backgroundColor: "inherit" }}>
                        <span style={S.metrica}>{fn.label}</span>
                      </td>
                      {dados.map((d) => {
                        const area = d.funcoes[fn.key]
                        return (
                          <td key={d.key} style={{ ...S.td, backgroundColor: "inherit" }}>
                            {area && d.ok ? (
                              <>
                                <span style={S.val}>{fmtBRL(area.liquidado)}</span>
                                <span style={S.sub}>{fmtPerCap(area.liquidado, d.pop)}</span>
                              </>
                            ) : (
                              <span style={S.sub}>—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Barra visual — gasto per capita total */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.label, marginBottom: "20px" }}>Gasto per capita {ANO} — liquidado ÷ população</p>
            {(() => {
              const maxPerCap = Math.max(...dados.filter((d) => d.ok).map((d) => d.totalLiquidado / d.pop))
              return (
                <div className="flex flex-col gap-5">
                  {dados.map((d) => {
                    const perCap = d.ok ? d.totalLiquidado / d.pop : 0
                    const pct = maxPerCap > 0 ? (perCap / maxPerCap) * 100 : 0
                    return (
                      <div key={d.key}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-01)" }}>{d.nome}</span>
                          <span style={{ fontSize: "13px", color: "var(--text-03)" }}>
                            {d.ok ? fmtPerCap(d.totalLiquidado, d.pop) : "sem dados"}
                          </span>
                        </div>
                        <div style={{ height: "8px", backgroundColor: "var(--bg-raised)", borderRadius: "2px" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${pct.toFixed(1)}%`,
                              backgroundColor: d.cor,
                              borderRadius: "2px",
                              transition: "width 400ms ease",
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </section>

        {/* Links para páginas individuais */}
        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.label, marginBottom: "16px" }}>Explorar cada município em detalhe</p>
            <div className="flex flex-wrap gap-4">
              {dados.map((d) => (
                <Link
                  key={d.key}
                  href={d.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2"
                  style={{
                    border: `1px solid ${d.cor}`,
                    color: d.cor,
                    textDecoration: "none",
                    transition: "background-color 100ms ease",
                  }}
                >
                  {d.nome} →
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Nota metodológica */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <p style={{ ...S.label, marginBottom: "12px" }}>Notas metodológicas</p>
            <ul
              style={{
                fontSize: "12px",
                color: "var(--text-04)",
                lineHeight: "20px",
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <li>Fonte: RREO Anexo 02 — SICONFI/Tesouro Nacional. Período: {ANO} (completo ou parcial — ano em curso).</li>
              <li>Valores nominais sem deflação. Para comparação histórica ajustada ao IPCA, acesse as páginas individuais de cada município.</li>
              <li>Populações: Sorocaba 685.645 · Paulínia 106.773 · São Paulo 11.451.245 (estimativas IBGE).</li>
              <li>Dado ausente (—) indica que a função não consta no RREO do município no período, não que o gasto é zero.</li>
            </ul>
            <div className="flex flex-wrap gap-6 mt-6">
              <Link href="/metodologia" className="nav-link" style={{ fontSize: "13px" }}>Metodologia completa</Link>
              <Link href="/como-citar" className="nav-link" style={{ fontSize: "13px" }}>Como citar</Link>
              <Link href="/" className="nav-link" style={{ fontSize: "13px" }}>← Início</Link>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
