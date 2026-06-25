import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Contratos e licitações — Paulínia",
  description:
    "Contratos firmados pelo Município de Paulínia publicados no PNCP (Portal Nacional de Contratações Públicas) 2023–2026: modalidade, valor global, fornecedor e vigência.",
  alternates: { canonical: `${SITE_URL}/paulinia/contratos` },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2023, 2024, 2025, 2026]

interface AnoResumo {
  ano: number
  total: number
  contratos: number
  pregao: number
  dispensa: number
  inexigibilidade: number
  outros: number
  topContratos: { titulo: string; valor: number; modalidade: string; data: string; url: string }[]
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

function loadAno(ano: number): AnoResumo | null {
  const filePath = path.join(
    DATA_ROOT, "paulinia", "compras", "pncp", "saida",
    `pncp_paulinia_contratos_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return null

  const text = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, "")
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)
  const iModal = idx("modalidade_licitacao_nome")
  const iValor = idx("valor_global")
  const iTitle = idx("title")
  const iUrl   = idx("item_url")
  const iData  = idx("data_assinatura")

  let total = 0, pregao = 0, dispensa = 0, inexig = 0, outros = 0
  const rowsData: { titulo: string; valor: number; modalidade: string; data: string; url: string }[] = []

  for (const line of lines.slice(1)) {
    const f = line.split(",")
    const modal  = (f[iModal] ?? "").trim()
    const valor  = parseFloat(f[iValor] ?? "0") || 0
    const titulo = (f[iTitle] ?? "").trim().replace(/^"|"$/g, "")
    const url    = (f[iUrl]  ?? "").trim().replace(/^"|"$/g, "")
    const data   = (f[iData] ?? "").trim().split("T")[0]
    total += valor
    if (modal.toLowerCase().includes("pregão")) pregao++
    else if (modal.toLowerCase().includes("dispensa")) dispensa++
    else if (modal.toLowerCase().includes("inexig")) inexig++
    else outros++
    rowsData.push({ titulo: titulo || `Contrato ${ano}`, valor, modalidade: modal, data, url })
  }

  const topContratos = rowsData
    .filter((r) => r.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)

  return {
    ano,
    total,
    contratos: lines.length - 1,
    pregao,
    dispensa,
    inexigibilidade: inexig,
    outros,
    topContratos,
  }
}

const jsonLd = [
  datasetSchema({
    name: "Contratos públicos — Paulínia 2023–2026 (PNCP)",
    description:
      "Contratos firmados pelo Município de Paulínia publicados no PNCP. Modalidade, valor global, fornecedor, vigência. IBGE 3536505. CNPJ 45751435000106.",
    url: `${SITE_URL}/paulinia/contratos`,
    temporalCoverage: "2023/2026",
    spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
    keywords: ["contratos", "licitações", "PNCP", "Paulínia", "compras públicas"],
    dateModified: "2026-06-13",
    downloadUrls: ANOS.map(
      (ano) =>
        `${SITE_URL}/api/dados/paulinia/compras/pncp/saida/pncp_paulinia_contratos_${ano}.csv`,
    ),
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "Paulínia", url: `${SITE_URL}/paulinia` },
    { name: "Contratos e licitações" },
  ]),
]

export default function PauliniaContratosPage() {
  const series = ANOS.map(loadAno).filter((r): r is AnoResumo => r !== null)
  const serieDesc = series.slice().sort((a, b) => b.ano - a.ano)
  const total2024 = series.find((s) => s.ano === 2024)
  const total2025 = series.find((s) => s.ano === 2025)

  const totalContratos = series.reduce((s, r) => s + r.contratos, 0)
  const totalValor = series.reduce((s, r) => s + r.total, 0)

  const insights: string[] = [
    ...(total2025 ? [
      `Em 2025, Paulínia publicou ${total2025.contratos} contratos no PNCP, totalizando ${fmt(total2025.total)} — crescimento de ${total2024 ? `+${((total2025.total / total2024.total - 1) * 100).toFixed(0)}% em relação a 2024` : "valor recorde na série"}.`,
    ] : []),
    ...(total2024 ? [
      `Em 2024, o pregão eletrônico respondeu por ${total2024.pregao} contratos; dispensas por ${total2024.dispensa}; inexigibilidades por ${total2024.inexigibilidade}.`,
    ] : []),
    "Os dados cobrem contratos registrados no PNCP a partir de 2023 (Lei 14.133/2021). Contratos anteriores a 2023 estão no arquivo consolidado do período de transição.",
    "Valores de 2026 são parciais (ano em curso). O PNCP é atualizado continuamente conforme novos contratos são publicados pelo município.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Contratos · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2023–2026
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Contratos e licitações — Paulínia
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                {totalContratos} contratos publicados no Portal Nacional de Contratações Públicas (PNCP)
                entre 2023 e 2026, totalizando{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(totalValor)}</strong> em valor global contratado.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Fonte: PNCP — Ministério da Gestão. Dados de contratos firmados a partir da
                vigência da Lei de Licitações (14.133/2021). O período de transição para o PNCP
                explica a ausência de dados anteriores a 2023.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Total contratos", valor: String(totalContratos), nota: "2023–2026 (2026 parcial)" },
                { label: "Valor global", valor: fmt(totalValor), nota: "Soma dos valores contratados" },
                ...(total2025 ? [
                  { label: "Contratos 2025", valor: String(total2025.contratos), nota: fmt(total2025.total) + " em valor" },
                  { label: "Pregão eletr. 2025", valor: String(total2025.pregao), nota: `${((total2025.pregao / total2025.contratos) * 100).toFixed(0)}% do total — modalidade mais frequente` },
                ] : []),
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

        {/* Série anual */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Resumo por ano</p>
            <div style={S.borderTop}>
              {serieDesc.map((r) => (
                <div key={r.ano} className="py-6" style={S.borderBottom}>
                  <div className="grid grid-cols-1 md:grid-cols-[80px_1fr_repeat(3,_auto)] gap-4 md:gap-8 items-start">
                    <div>
                      <p style={{ ...S.label, color: "var(--blue-40)" }}>{r.ano}</p>
                      <p className="font-light mt-1" style={{ fontSize: "20px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.total)}</p>
                      <p style={S.caption}>{r.contratos} contratos</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Pregão eletr.", valor: r.pregao },
                        { label: "Dispensa", valor: r.dispensa },
                        { label: "Inexigib.", valor: r.inexigibilidade },
                      ].map((m) => (
                        <div key={m.label}>
                          <p style={S.caption}>{m.label}</p>
                          <p style={{ ...S.body, fontVariantNumeric: "tabular-nums" }}>{m.valor}</p>
                        </div>
                      ))}
                    </div>
                    <div className="md:col-span-2">
                      <p style={{ ...S.caption, marginBottom: "8px" }}>Maiores contratos</p>
                      <div className="flex flex-col gap-1">
                        {r.topContratos.slice(0, 4).map((c, i) => (
                          <div key={i} className="flex items-baseline gap-2">
                            <span style={{ ...S.caption, fontVariantNumeric: "tabular-nums", minWidth: "72px" }}>{fmt(c.valor)}</span>
                            {c.url ? (
                              <a href={c.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: "12px", color: "var(--blue-40)", textDecoration: "none" }}
                                className="hover:underline truncate">
                                {c.titulo.length > 50 ? c.titulo.slice(0, 50) + "…" : c.titulo}
                              </a>
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--text-03)" }}>{c.titulo.length > 50 ? c.titulo.slice(0, 50) + "…" : c.titulo}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Contratos PNCP por ano</h2>
            <div className="flex flex-wrap gap-3 mb-6">
              {ANOS.slice().reverse().map((ano) => (
                <a key={ano} href={`/api/dados/paulinia/compras/pncp/saida/pncp_paulinia_contratos_${ano}.csv`} className="nav-link" download>
                  Contratos {ano}
                </a>
              ))}
            </div>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Atas de registro de preços</h2>
            <div className="flex flex-wrap gap-3 mb-6">
              {[2024, 2025, 2026].map((ano) => (
                <a key={ano} href={`/api/dados/paulinia/compras/pncp/saida/pncp_paulinia_atas_${ano}.csv`} className="nav-link" download>
                  Atas {ano}
                </a>
              ))}
            </div>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Compras / editais</h2>
            <div className="flex flex-wrap gap-3">
              {[2023, 2024, 2025, 2026].map((ano) => (
                <a key={ano} href={`/api/dados/paulinia/compras/pncp/saida/pncp_paulinia_compras_${ano}.csv`} className="nav-link" download>
                  Compras {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: PNCP — Portal Nacional de Contratações Públicas (pncp.gov.br). CNPJ 45751435000106. Atualizado via robô Playwright em 2026-06-13.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/paulinia/saude-fiscal" className="nav-link">Saúde fiscal</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
