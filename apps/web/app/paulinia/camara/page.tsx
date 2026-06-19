import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"

export const metadata: Metadata = {
  title: "Câmara Municipal de Paulínia — Execução orçamentária",
  description:
    "Empenhos, pagamentos e receitas da Câmara Municipal de Paulínia 2023–2026. Fonte: SMARAPD Câmara de Paulínia.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia/camara" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2023, 2024, 2025, 2026]

interface CamaraAnual {
  ano: number
  empenhado: number
  pago: number
  receita: number
  n_empenhos: number
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

function sumCol(lines: string[], headers: string[], col: string): number {
  const idx = headers.indexOf(col)
  if (idx === -1) return 0
  let total = 0
  for (const line of lines) {
    const fields = line.split(",")
    const raw = (fields[idx] ?? "").trim()
    if (!raw) continue
    const c = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw
    total += parseFloat(c) || 0
  }
  return total
}

function loadCamara(ano: number): CamaraAnual {
  const base = path.join(DATA_ROOT, "paulinia", "camara", "saida")
  let empenhado = 0, pago = 0, receita = 0, n_empenhos = 0

  const fEmp = path.join(base, `camara_empenhos_paulinia_${ano}.csv`)
  if (fs.existsSync(fEmp)) {
    const lines = fs.readFileSync(fEmp, "utf-8").split("\n").filter(Boolean)
    const h = lines[0].split(",").map(s => s.trim().toLowerCase())
    empenhado = sumCol(lines.slice(1), h, "valor_empenhado")
    n_empenhos = lines.length - 1
  }

  const fPag = path.join(base, `camara_pagamentos_paulinia_${ano}.csv`)
  if (fs.existsSync(fPag)) {
    const lines = fs.readFileSync(fPag, "utf-8").split("\n").filter(Boolean)
    const h = lines[0].split(",").map(s => s.trim().toLowerCase())
    pago = sumCol(lines.slice(1), h, "valor_pago")
  }

  const fRec = path.join(base, `camara_receita_paulinia_${ano}.csv`)
  if (fs.existsSync(fRec)) {
    const lines = fs.readFileSync(fRec, "utf-8").split("\n").filter(Boolean)
    const h = lines[0].split(",").map(s => s.trim().toLowerCase())
    receita = sumCol(lines.slice(1), h, "valor")
  }

  return { ano, empenhado, pago, receita, n_empenhos }
}

export default function PauliniaCamaraPage() {
  const serie = ANOS.map(loadCamara).filter(r => r.n_empenhos > 0)
  const recente = [...serie].sort((a, b) => b.ano - a.ano).find(r => r.ano < 2026) ?? serie[0]
  const anoRef = recente?.ano ?? 2025

  const chartData: SerieHistoricaPoint[] = [...serie]
    .filter(r => r.ano < 2026)
    .sort((a, b) => a.ano - b.ano)
    .map(r => ({ ano: String(r.ano), fixado: 0, liquidado: r.empenhado }))

  const insights: string[] = [
    ...(recente ? [
      `Em ${anoRef}, a Câmara Municipal empenheu ${fmt(recente.empenhado)} e pagou ${fmt(recente.pago)} — execução de ${(recente.pago / recente.empenhado * 100).toFixed(0)}% dos empenhos no exercício.`,
      `A receita registrada no Fundo da Câmara foi ${fmt(recente.receita)}, composta principalmente por repasses do Executivo municipal e retenções (IRRF, ISSQN).`,
    ] : []),
    "A Câmara de Paulínia publica seus dados via SMARAPD (Sistema Municipal de Administração e Acompanhamento de Receitas e Despesas Públicas), o mesmo sistema usado pelo Executivo.",
    "Dados de 2026 são parciais — o exercício ainda está em curso.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Câmara Municipal · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2023–2026
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Execução orçamentária da Câmara Municipal de Paulínia
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Empenhos, pagamentos e receitas do Poder Legislativo Municipal de Paulínia, conforme
                registrado no SMARAPD da Câmara. Série histórica 2023–2026.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {recente && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>Ano de referência — {anoRef}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "Total Empenhado",   valor: fmt(recente.empenhado), nota: `${recente.n_empenhos.toLocaleString("pt-BR")} empenhos registrados` },
                  { label: "Total Pago",        valor: fmt(recente.pago),      nota: `${(recente.pago / recente.empenhado * 100).toFixed(0)}% dos empenhos liquidados e pagos` },
                  { label: "Receita da Câmara", valor: fmt(recente.receita),   nota: "Repasses do Executivo + retenções tributárias" },
                ].map(item => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Série histórica */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Execução por ano</p>
                <h2 style={S.h2}>Empenhos, pagamentos e receita</h2>
                <div style={S.borderTop}>
                  {[...serie].sort((a, b) => b.ano - a.ano).map(r => (
                    <div key={r.ano} className="py-4" style={S.borderBottom}>
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{ fontSize: "13px", color: r.ano === anoRef ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoRef ? 600 : 400 }}>
                          {r.ano}{r.ano === 2026 ? " (parcial)" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p style={S.caption}>Empenhado</p>
                          <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.empenhado)}</p>
                        </div>
                        <div>
                          <p style={S.caption}>Pago</p>
                          <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.pago)}</p>
                        </div>
                        <div>
                          <p style={S.caption}>Receita</p>
                          <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.receita)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Total empenhado por ano (2023–2025)</p>
                <SerieHistorica data={chartData} unit="mi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Empenhos",  prefix: "camara_empenhos_paulinia" },
                { label: "Pagamentos", prefix: "camara_pagamentos_paulinia" },
                { label: "Receitas",   prefix: "camara_receita_paulinia" },
              ].map(({ label, prefix }) => (
                <div key={prefix}>
                  <p style={{ ...S.body, fontWeight: 600, marginBottom: "8px" }}>{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {ANOS.map(ano => (
                      <a key={ano} href={`/api/dados/paulinia/camara/saida/${prefix}_${ano}.csv`} className="nav-link" download>
                        CSV {ano}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SMARAPD — Sistema Municipal de Administração e Acompanhamento de Receitas e Despesas Públicas (Câmara de Paulínia).
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/executivo" className="nav-link">Executivo</Link>
            <Link href="/paulinia/saude-fiscal" className="nav-link">Saúde Fiscal</Link>
            <Link href="/paulinia/transferencias" className="nav-link">Transferências</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
