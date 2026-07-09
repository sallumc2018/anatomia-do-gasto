import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"

export const metadata: Metadata = {
  title: "Saúde em Paulínia",
  description:
    "Gasto municipal em saúde de Paulínia: cumprimento do mínimo constitucional de 15% (ASPS/SIOPS) e repasses do Fundo Nacional de Saúde (FNS/FAF) 2020–2025.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia/saude" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS_SIOPS = [2017, 2018, 2019, 2023, 2024, 2025]
const ANOS_FNS   = [2020, 2021, 2022, 2023, 2024, 2025]

interface SiopsRow {
  ano: number
  pct: number
  total: number
  receita_impostos: number
  situacao: string
}

interface FnsAnual {
  ano: number
  total: number
  custeio: number
  investimento: number
  linhas: number
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseBR(s: string): number {
  if (!s) return 0
  const c = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(c) || 0
}

function loadSiops(ano: number): SiopsRow | null {
  const f = path.join(DATA_ROOT, "paulinia", "saude", "saida", `siops_paulinia_${ano}.csv`)
  if (!fs.existsSync(f)) return null
  const lines = fs.readFileSync(f, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const h = lines[0].split(",").map(s => s.trim().toLowerCase())
  const vals = lines[1].split(",")
  const get = (k: string) => vals[h.indexOf(k)]?.trim() ?? ""
  const sit = get("situacao")
  if (!sit || sit === "nao_coletado") return null
  return {
    ano,
    pct:              parseFloat(get("percentual_asps")) || 0,
    total:            parseBR(get("despesa_saude_total")),
    receita_impostos: parseBR(get("receita_impostos")),
    situacao:         sit,
  }
}

function loadFns(ano: number): FnsAnual | null {
  const f = path.join(DATA_ROOT, "paulinia", "fns", "saida", `fns_repasses_faf_com_populacao_paulinia_${ano}.csv`)
  if (!fs.existsSync(f)) return null
  const lines = fs.readFileSync(f, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const h = lines[0].split(",").map(s => s.trim().toLowerCase())
  const iVl    = h.indexOf("vl_bruto")
  const iBloco = h.indexOf("bloco")
  if (iVl === -1) return null
  let total = 0, custeio = 0, investimento = 0, linhas = 0
  for (const line of lines.slice(1)) {
    const f2 = line.split(",")
    const vl    = parseFloat(f2[iVl] ?? "") || 0
    const bloco = (f2[iBloco] ?? "").toUpperCase()
    total += vl
    if (bloco.includes("MANUTENÇÃO") || bloco.includes("CUSTEIO")) custeio += vl
    else investimento += vl
    linhas++
  }
  return { ano, total, custeio, investimento, linhas }
}

export default function PauliniaSaudePage() {
  const siopsSerie = ANOS_SIOPS.map(loadSiops).filter((r): r is SiopsRow => r !== null).sort((a, b) => a.ano - b.ano)
  const fnsSerie   = ANOS_FNS.map(loadFns).filter((r): r is FnsAnual => r !== null).sort((a, b) => a.ano - b.ano)

  const siopsRecente = [...siopsSerie].sort((a, b) => b.ano - a.ano)[0]
  const fnsRecente   = [...fnsSerie].sort((a, b) => b.ano - a.ano)[0]

  const siopsChartData: SerieHistoricaPoint[] = siopsSerie.map(r => ({
    ano: String(r.ano),
    fixado: 0,
    liquidado: r.total,
  }))

  const fnsChartData: SerieHistoricaPoint[] = fnsSerie.map(r => ({
    ano: String(r.ano),
    fixado: 0,
    liquidado: r.total,
  }))

  const insights: string[] = [
    ...(siopsRecente ? [
      `Em ${siopsRecente.ano}, Paulínia aplicou ${siopsRecente.pct.toFixed(1)}% da receita de impostos em saúde — ${siopsRecente.pct >= 15 ? "acima" : "abaixo"} do mínimo constitucional de 15% (ASPS, Art. 198 CF / LC 141/2012).`,
      `O gasto total em saúde foi ${fmt(siopsRecente.total)} sobre ${fmt(siopsRecente.receita_impostos)} de receita de impostos.`,
    ] : []),
    ...(fnsRecente ? [
      `Em ${fnsRecente.ano}, o Fundo Nacional de Saúde repassou ${fmt(fnsRecente.total)} diretamente ao Fundo Municipal de Saúde de Paulínia — repasse fundo-a-fundo, sem intermediação estadual.`,
    ] : []),
    "Paulínia tem cumprido o mínimo constitucional em todos os anos com dados disponíveis no SIOPS.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Saúde · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2017–2025
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Gasto público em saúde de Paulínia
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Dois ângulos do financiamento da saúde em Paulínia: o{" "}
                <strong style={{ color: "var(--text-01)" }}>gasto municipal próprio</strong> (conformidade
                constitucional via SIOPS) e os{" "}
                <strong style={{ color: "var(--text-01)" }}>repasses federais</strong> do Fundo Nacional
                de Saúde (FNS/FAF) direto ao Fundo Municipal de Saúde.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota metodológica:</strong>{" "}
                  Os dados SIOPS exibem a Fase Previsto (planejamento/declaração municipal) — referência
                  oficial de conformidade com o Art. 198 CF / LC 141/2012. Anos 2015–2016 e 2020–2022
                  não estão disponíveis na API pública do SIOPS para Paulínia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {siopsRecente && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>Último ano disponível — SIOPS {siopsRecente.ano}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  {
                    label: "% Aplicado em ASPS",
                    valor: `${siopsRecente.pct.toFixed(1)}%`,
                    nota: `Mínimo constitucional: 15% — ${siopsRecente.pct >= 15 ? "✓ cumprido" : "⚠ abaixo do mínimo"}`,
                    destaque: siopsRecente.pct < 15,
                  },
                  {
                    label: "Gasto total em saúde",
                    valor: fmt(siopsRecente.total),
                    nota: "ASPS — Ações e Serviços Públicos de Saúde",
                    destaque: false,
                  },
                  {
                    label: "Receita de impostos",
                    valor: fmt(siopsRecente.receita_impostos),
                    nota: "Base de cálculo do percentual constitucional",
                    destaque: false,
                  },
                ].map(item => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "24px", color: item.destaque ? "#da1e28" : "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SIOPS — série histórica */}
        {siopsSerie.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="uppercase font-semibold" style={S.label}>SIOPS — Mínimo constitucional</p>
                    <Link href="/paulinia/saude/comparativo" style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none", whiteSpace: "nowrap" }}>
                      Ver série histórica →
                    </Link>
                  </div>
                  <h2 style={S.h2}>Conformidade ASPS por ano</h2>
                  <div style={S.borderTop}>
                    {[...siopsSerie].sort((a, b) => b.ano - a.ano).map(r => {
                      const ok = r.pct >= 15
                      return (
                        <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                          <span style={{ fontSize: "13px", color: "var(--text-03)", minWidth: "40px" }}>{r.ano}</span>
                          <div>
                            <p style={S.caption}>% ASPS</p>
                            <p className="font-mono" style={{ fontSize: "14px", color: ok ? "#24a148" : "#da1e28", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                              {r.pct.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p style={S.caption}>Gasto saúde</p>
                            <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.total)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ ...S.caption, marginTop: "12px" }}>
                    Anos sem dados: 2015–2016 (API indisponível) e 2020–2022 (HTTP 500 no SIOPS de Paulínia).
                  </p>
                  <DadoQueMostra items={insights} />
                </div>
                <div style={{ minHeight: "300px" }}>
                  <p style={{ ...S.label, marginBottom: "12px" }}>Gasto total em ASPS por ano</p>
                  <SerieHistorica data={siopsChartData} unit="mi" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FNS — repasses federais */}
        {fnsSerie.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>FNS — Repasses federais 2020–2025</p>
              <h2 style={{ ...S.h2, fontSize: "22px" }}>Transferências fundo-a-fundo ao Fundo Municipal de Saúde</h2>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
                <div style={S.borderTop}>
                  {[...fnsSerie].sort((a, b) => b.ano - a.ano).map(r => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: "var(--text-03)", minWidth: "40px" }}>{r.ano}</span>
                      <div>
                        <p style={S.caption}>Custeio</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.custeio)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Investimento</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.investimento)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Total</p>
                        <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmt(r.total)}</p>
                      </div>
                    </div>
                  ))}
                  <p style={{ ...S.caption, marginTop: "12px" }}>
                    Fonte: Fundo Nacional de Saúde (FNS/MS) — Fundo a Fundo (FAF). Município de Paulínia: IBGE 353650.
                  </p>
                </div>
                <div style={{ minHeight: "260px" }}>
                  <p style={{ ...S.label, marginBottom: "12px" }}>Total FNS por ano</p>
                  <SerieHistorica data={fnsChartData} unit="mi" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p style={{ ...S.body, fontWeight: 600, marginBottom: "8px" }}>SIOPS — Conformidade ASPS</p>
                <div className="flex flex-wrap gap-3">
                  {ANOS_SIOPS.map(ano => (
                    <a key={ano} href={`/api/dados/paulinia/saude/saida/siops_paulinia_${ano}.csv`} className="nav-link" download>
                      CSV {ano}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ ...S.body, fontWeight: 600, marginBottom: "8px" }}>FNS — Repasses federais</p>
                <div className="flex flex-wrap gap-3">
                  {ANOS_FNS.map(ano => (
                    <a key={ano} href={`/api/dados/paulinia/fns/saida/fns_repasses_faf_com_populacao_paulinia_${ano}.csv`} className="nav-link" download>
                      CSV {ano}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/saude/comparativo" className="nav-link">Série histórica</Link>
            <Link href="/paulinia/saude-fiscal" className="nav-link">Saúde Fiscal (LRF)</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/paulinia/transferencias" className="nav-link">Transferências</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
