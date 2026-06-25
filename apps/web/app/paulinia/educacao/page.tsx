import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Educação em Paulínia",
  description:
    "Gasto municipal em educação de Paulínia 2020–2025: dotação aprovada, liquidado e participação no orçamento total. Fonte: RREO Anexo 02 / SICONFI — Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/paulinia/educacao` },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2020, 2021, 2022, 2023, 2024, 2025]

interface EducAnual {
  ano: number
  dotacao: number
  empenhado: number
  liquidado: number
  totalMun: number
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
  const cleaned = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(cleaned) || 0
}

function loadEducAnual(ano: number): EducAnual | null {
  const filePath = path.join(
    DATA_ROOT, "paulinia", "executivo", "saida",
    `despesas_executivo_paulinia_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return null

  const lines = fs.readFileSync(filePath, "utf-8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)
  const iFuncao = idx("Funcao")
  const iDot    = idx("Dotacao_Inicial")
  const iEmp    = idx("Empenhado")
  const iLiq    = idx("Liquidado")

  let educ: { dot: number; emp: number; liq: number } | null = null
  let totalMun = 0

  for (const line of lines.slice(1)) {
    const f = line.split(",")
    const funcao = (f[iFuncao] ?? "").trim().toLowerCase()
    const liq = parseBR(f[iLiq] ?? "")
    if (funcao === "educação" || funcao === "educacao") {
      educ = {
        dot: parseBR(f[iDot] ?? ""),
        emp: parseBR(f[iEmp] ?? ""),
        liq,
      }
    }
    if (funcao.startsWith("total")) totalMun += liq
  }

  if (!educ) return null
  return { ano, dotacao: educ.dot, empenhado: educ.emp, liquidado: educ.liq, totalMun }
}

const jsonLd = [
  datasetSchema({
    name: "Despesas em educação — Paulínia 2020–2025",
    description:
      "Execução orçamentária em educação (função 12) do Município de Paulínia: dotação inicial, empenhado e liquidado. Fonte: RREO Anexo 02 / SICONFI. IBGE 3536505.",
    url: `${SITE_URL}/paulinia/educacao`,
    temporalCoverage: "2020/2025",
    spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
    keywords: ["educação", "Paulínia", "SICONFI", "MDE", "FUNDEB", "orçamento"],
    dateModified: "2026-06-25",
    downloadUrls: ANOS.map(
      (ano) =>
        `${SITE_URL}/api/dados/paulinia/executivo/saida/despesas_executivo_paulinia_${ano}.csv`,
    ),
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "Paulínia", url: `${SITE_URL}/paulinia` },
    { name: "Educação" },
  ]),
]

export default function PauliniaEducacaoPage() {
  const serie: EducAnual[] = ANOS
    .map(loadEducAnual)
    .filter((r): r is EducAnual => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const atual = serie[0]
  const anoAtual = atual?.ano ?? 2025
  const base2020 = serie.find((s) => s.ano === 2020)

  const growth = base2020 && atual && base2020.liquidado > 0
    ? ((atual.liquidado - base2020.liquidado) / base2020.liquidado * 100)
    : null

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChart: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: s.dotacao,
    liquidado: s.liquidado,
  }))

  const pctAtual = atual && atual.totalMun > 0
    ? (atual.liquidado / atual.totalMun * 100)
    : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, Paulínia liquidou ${fmt(atual.liquidado)} em educação — ${pctAtual ? `${pctAtual.toFixed(1)}% do orçamento municipal total.` : "maior área individual do orçamento."}`,
    ] : []),
    ...(growth !== null ? [
      `Entre 2020 e ${anoAtual}, o gasto liquidado em educação cresceu +${growth.toFixed(0)}% em termos nominais — de ${fmt(base2020!.liquidado)} para ${fmt(atual!.liquidado)}.`,
    ] : []),
    "Paulínia é um dos municípios com maior gasto per capita em educação do estado de São Paulo, sustentado pela arrecadação do ISS sobre a refinaria REPLAN (Petrobras).",
    "A dotação inicial aprovada em LOA tende a subestimar o liquidado em anos recentes: em 2022 e 2023, o liquidado superou a dotação inicial — indicando suplementações ao longo do exercício.",
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
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--green-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Educação · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Gasto municipal em educação — Paulínia
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, o Município de Paulínia liquidou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em educação
                  {pctAtual && ` — ${pctAtual.toFixed(1)}% do orçamento municipal total`}.
                  A dotação inicial aprovada em LOA foi de {fmt(atual.dotacao)}.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados extraídos do RREO Anexo 02 (função Educação) via SICONFI/Tesouro Nacional.
                Cobrem o orçamento executado pelo Executivo municipal; a Câmara Municipal tem orçamento separado.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota metodológica:</strong>{" "}
                  Esta página mostra a execução orçamentária da função Educação (RREO Anexo 02).
                  Os dados de cumprimento do mínimo constitucional de MDE (25%) via SIOPE/FNDE
                  estão temporariamente indisponíveis para Paulínia — a API retorna resposta vazia.
                  O gasto total pelo RREO inclui todas as fontes (próprias + transferências).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    label: `Liquidado ${anoAtual}`,
                    valor: fmt(atual.liquidado),
                    nota: "Gasto efetivamente liquidado em educação",
                  },
                  {
                    label: `Dotação inicial ${anoAtual}`,
                    valor: fmt(atual.dotacao),
                    nota: "Valor aprovado na LOA — antes de suplementações",
                  },
                  {
                    label: "% do orçamento",
                    valor: pctAtual ? `${pctAtual.toFixed(1)}%` : "—",
                    nota: "Participação da educação no total liquidado municipal",
                  },
                  {
                    label: "Crescimento 2020–" + anoAtual,
                    valor: growth !== null ? `+${growth.toFixed(0)}%` : "—",
                    nota: "Variação nominal do liquidado em educação",
                  },
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

        {/* Série histórica */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Execução 2020–{anoAtual}</p>
                <h2 style={S.h2}>Evolução do gasto em educação</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--green-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>Dotação</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.dotacao)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Liquidado</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(r.liquidado)}
                        </p>
                      </div>
                      <div>
                        <p style={S.caption}>% orçamento</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                          {r.totalMun > 0 ? `${(r.liquidado / r.totalMun * 100).toFixed(1)}%` : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Dotação vs. liquidado por ano (R$)</p>
                <SerieHistorica data={serieChart} unit="mi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>RREO Anexo 02 — execução por função (inclui educação)</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Cada arquivo contém a execução orçamentária de todas as funções do Município de Paulínia
              no exercício. Para isolar a função Educação, filtre a coluna <code style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}>Funcao</code> pelo valor &ldquo;Educação&rdquo;.
            </p>
            <div className="flex flex-wrap gap-3">
              {ANOS.slice().reverse().map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/paulinia/executivo/saida/despesas_executivo_paulinia_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SICONFI / Tesouro Nacional — RREO Anexo 02 (Demonstrativo da Execução das Despesas por Função/Subfunção). Município de Paulínia — IBGE 3536505. Valores nominais em BRL. Bimestre 6 (fechamento do exercício) quando disponível.
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Por que Paulínia gasta tanto em educação?</p>
                <p style={S.body}>
                  Paulínia arrecada mais de R$ 2 bilhões por ano em ISS, IPTU e IRRF — em grande parte
                  graças à Refinaria de Paulínia (REPLAN) da Petrobras, uma das maiores do país.
                  Com uma base tributária desproporcional ao tamanho populacional (~100 mil habitantes),
                  o município consegue investir em educação um valor absoluto superior a cidades com
                  até 5× mais habitantes.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  O mínimo constitucional obrigatório é de 25% das receitas de impostos vinculadas
                  à educação (MDE). Os dados de MDE individual por receita são reportados ao SIOPE/FNDE,
                  mas estão temporariamente indisponíveis via API para Paulínia.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Sobre os dados</p>
                <p style={S.body}>
                  O RREO Anexo 02 consolida a execução orçamentária por função de governo. A função
                  12 — Educação — agrupa pré-escola, ensino fundamental, ensino médio técnico,
                  educação especial e demais ações municipais em educação. Os valores são extraídos
                  do bimestre 6 (referência: 31 de dezembro), que representa o fechamento do exercício.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Liquidado vs. pago:</strong>{" "}
                  O liquidado representa despesas reconhecidas (etapa anterior ao pagamento).
                  O valor pago pode ser ligeiramente inferior ao liquidado em virtude de restos a pagar.
                  Fonte primária: apidatalake.tesouro.gov.br/ords/siconfi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/paulinia/receita" className="nav-link">Receitas</Link>
            <Link href="/paulinia/saude" className="nav-link">Saúde</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
