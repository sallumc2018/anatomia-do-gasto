import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Fornecedores e empenhos — Paulínia",
  description:
    "Empenhos e pagamentos do Município de Paulínia por fornecedor 2020–2026: maiores credores, volume por ano e downloads CSV. Fonte: SMARAPD/Portal da Transparência de Paulínia.",
  alternates: { canonical: `${SITE_URL}/paulinia/fornecedores` },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

interface AnoResumo {
  ano: number
  totalEmpenhos: number
  totalValor: number
  topFornecedores: { nome: string; valor: number; empenhos: number }[]
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
  const cleaned = s.trim().replace(/R\$\s*/g, "").replace(/\s/g, "")
  if (cleaned.includes(",")) return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0
  return parseFloat(cleaned) || 0
}

function loadAno(ano: number): AnoResumo | null {
  const filePath = path.join(
    DATA_ROOT, "paulinia", "despesa", "saida",
    `empenhos_fornecedores_paulinia_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return null

  const text = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, "")
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  const iNome = headers.indexOf("nome_fornecedor")
  const iVl   = headers.indexOf("valor_bruto")

  const agg = new Map<string, { valor: number; count: number }>()
  let totalValor = 0

  for (const line of lines.slice(1)) {
    const f = line.split(",")
    const nome = (f[iNome] ?? "").trim()
    const vl   = parseBR(f[iVl] ?? "")
    totalValor += vl
    const cur = agg.get(nome) ?? { valor: 0, count: 0 }
    cur.valor += vl
    cur.count += 1
    agg.set(nome, cur)
  }

  const topFornecedores = Array.from(agg.entries())
    .filter(([nome]) => nome && nome !== "MUNICIPIO DE PAULINIA")
    .map(([nome, d]) => ({ nome, valor: d.valor, empenhos: d.count }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  return {
    ano,
    totalEmpenhos: lines.length - 1,
    totalValor,
    topFornecedores,
  }
}

const jsonLd = [
  datasetSchema({
    name: "Empenhos por fornecedor — Paulínia 2020–2026",
    description:
      "Registro de empenhos do Município de Paulínia por fornecedor: nome, CNPJ/CPF, valor bruto, valor líquido, data de pagamento. IBGE 3536505.",
    url: `${SITE_URL}/paulinia/fornecedores`,
    temporalCoverage: "2020/2026",
    spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
    keywords: ["fornecedores", "empenhos", "despesa", "Paulínia", "transparência"],
    dateModified: "2026-06-10",
    downloadUrls: ANOS.map(
      (ano) =>
        `${SITE_URL}/api/dados/paulinia/despesa/saida/empenhos_fornecedores_paulinia_${ano}.csv`,
    ),
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "Paulínia", url: `${SITE_URL}/paulinia` },
    { name: "Fornecedores e empenhos" },
  ]),
]

export default function PauliniaFornecedoresPage() {
  const series = ANOS.map(loadAno).filter((r): r is AnoResumo => r !== null)
  const serieDesc = series.slice().sort((a, b) => b.ano - a.ano)
  const atual = serieDesc.find((s) => s.ano !== 2026) ?? serieDesc[0]
  const totalEmpenhos = series.reduce((s, r) => s + r.totalEmpenhos, 0)

  const insights: string[] = [
    ...(atual ? [
      `Em ${atual.ano}, Paulínia registrou ${atual.totalEmpenhos.toLocaleString("pt-BR")} empenhos, totalizando ${fmt(atual.totalValor)} em valor bruto.`,
      `Os 10 maiores credores responderam por ${fmt(atual.topFornecedores.slice(0, 10).reduce((s, f) => s + f.valor, 0))} — ${((atual.topFornecedores.slice(0, 10).reduce((s, f) => s + f.valor, 0) / atual.totalValor) * 100).toFixed(0)}% do total.`,
    ] : []),
    "O registro de empenhos inclui transferências intragovernamentais (ex.: repasses ao RPPS e ao CISMETRO). O valor bruto por fornecedor inclui todos os empenhos, inclusive cancelamentos e devoluções.",
    "Dados de 2020–2022 podem estar incompletos: o portal SMARAPD de Paulínia passa por fases de digitalização retroativa e alguns meses podem não estar representados.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--orange-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Fornecedores · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2020–2026
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Fornecedores e empenhos municipais — Paulínia
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                {totalEmpenhos.toLocaleString("pt-BR")} empenhos registrados entre 2020 e 2026,
                cobrindo todos os credores do Município de Paulínia: empresas prestadoras de serviços,
                fornecedores de materiais, entidades conveniadas e transferências previdenciárias.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Fonte: portal de transparência SMARAPD de Paulínia. Dados de 2026 são parciais (ano em curso).
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: `Empenhos ${atual.ano}`, valor: atual.totalEmpenhos.toLocaleString("pt-BR"), nota: "Total de documentos de empenho no exercício" },
                  { label: `Total empenhado ${atual.ano}`, valor: fmt(atual.totalValor), nota: "Valor bruto incluindo transferências intragovernamentais" },
                  { label: "Registros 2020–2026", valor: totalEmpenhos.toLocaleString("pt-BR"), nota: "Soma de empenhos em todos os exercícios disponíveis" },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Maiores credores por ano */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Maiores credores por ano</p>
            <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "24px", maxWidth: "640px" }}>
              Excluindo empenhos internos (Município de Paulínia para si mesmo). Valores em R$.
            </p>
            <div style={S.borderTop}>
              {serieDesc.map((r) => (
                <div key={r.ano} className="py-8" style={S.borderBottom}>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--orange-40)", minWidth: "44px" }}>{r.ano}</span>
                    <span style={{ ...S.body, color: "var(--text-03)" }}>
                      {r.totalEmpenhos.toLocaleString("pt-BR")} empenhos · {fmt(r.totalValor)} total
                      {r.ano === 2026 ? " (parcial)" : ""}
                    </span>
                  </div>
                  <div style={S.borderTop}>
                    {r.topFornecedores.slice(0, 8).map((f, i) => (
                      <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 py-2 items-baseline" style={S.borderBottom}>
                        <span style={{ ...S.caption, minWidth: "18px", textAlign: "right" }}>{i + 1}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-02)" }}>
                          {f.nome.length > 60 ? f.nome.slice(0, 60) + "…" : f.nome}
                          <span style={{ ...S.caption, marginLeft: "8px" }}>({f.empenhos} emp.)</span>
                        </span>
                        <span style={{ fontSize: "13px", fontVariantNumeric: "tabular-nums", color: "var(--text-01)", fontWeight: 500 }}>
                          {fmt(f.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DadoQueMostra items={insights} />
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Empenhos por fornecedor — por exercício</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Cada arquivo contém todos os empenhos do exercício com nome do fornecedor, CNPJ/CPF,
              número do empenho, valor bruto, valor líquido e data de pagamento.
            </p>
            <div className="flex flex-wrap gap-3">
              {ANOS.slice().reverse().map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/paulinia/despesa/saida/empenhos_fornecedores_paulinia_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  {ano}{ano === 2026 ? " (parcial)" : ""}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: Portal de Transparência de Paulínia — SMARAPD. Dados coletados em 2026-06-10. Valores nominais em BRL.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/contratos" className="nav-link">Contratos PNCP</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
