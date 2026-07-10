import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { JsonLd } from "@/components/seo/json-ld"
import { datasetSchema, breadcrumbSchema, SITE_URL } from "@/lib/structured-data"

const FNS_DATASET = datasetSchema({
  name: "Repasses do Fundo Nacional de Saúde (FNS/FAF) ao Município de São Paulo — 2020–2025",
  description: "Série histórica dos repasses fundo-a-fundo do FNS ao Fundo Municipal de Saúde de São Paulo. Inclui blocos de custeio (manutenção de serviços SUS) e investimento (estruturação da rede), com grupos, estratégias, CNPJ da entidade receptora e valores brutos/líquidos. Município IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/saude`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["FNS", "Fundo Nacional de Saúde", "repasses saúde", "SUS", "custeio saúde", "São Paulo", "saúde pública", "transferência fundo-a-fundo"],
  dateModified: "2026-06-20",
  downloadUrls: [2020, 2021, 2022, 2023, 2024, 2025].map(
    (ano) => `${SITE_URL}/api/dados/sao_paulo/fns/saida/fns_repasses_faf_com_populacao_sao_paulo_${ano}.csv`
  ),
})

const SP_SAUDE_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: "https://www.anatomiadogasto.ong.br" },
  { name: "São Paulo", url: "https://www.anatomiadogasto.ong.br/sao-paulo" },
  { name: "Repasses federais de saúde (FNS)" },
])

export const metadata: Metadata = {
  title: "Repasses Federais de Saúde — São Paulo",
  description:
    "Repasses do Fundo Nacional de Saúde (FNS/FAF) ao Município de São Paulo. Série histórica 2020–2025. Custeio e investimento em saúde. Fonte: FNS/Ministério da Saúde.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/saude" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2020, 2021, 2022, 2023, 2024, 2025]

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

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parseBR(s: string): number {
  if (!s) return 0
  // Some years use "." as decimal separator (no thousands), others use BR format
  const cleaned = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  return parseFloat(cleaned) || 0
}

function isCusteio(bloco: string): boolean {
  const b = bloco.toUpperCase()
  return b.includes("MANUTENÇÃO") || b.includes("CUSTEIO")
}

function loadFnsAnual(ano: number): FnsAnual | null {
  const filePath = path.join(
    DATA_ROOT, "sao_paulo", "fns", "saida",
    `fns_repasses_faf_com_populacao_sao_paulo_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return null
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const iBloco = headers.indexOf("bloco")
  const iVl    = headers.indexOf("vl_bruto")
  if (iVl === -1) return null

  let total = 0, custeio = 0, investimento = 0
  let linhas = 0
  for (const line of lines.slice(1)) {
    const f = line.split(",")
    const vl = parseBR(f[iVl] ?? "")
    const bloco = f[iBloco] ?? ""
    total += vl
    if (isCusteio(bloco)) custeio += vl
    else investimento += vl
    linhas++
  }
  return { ano, total, custeio, investimento, linhas }
}

export default function SaoPauloSaudePage() {
  const serie: FnsAnual[] = ANOS
    .map(loadFnsAnual)
    .filter((r): r is FnsAnual => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const anoAtual = serie[0]?.ano ?? 2025
  const atual = serie[0]

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: 0,
    liquidado: s.total,
  }))

  const s2020 = serie.find((s) => s.ano === 2020)
  const growth = s2020 && s2020.total > 0 && atual
    ? ((atual.total - s2020.total) / s2020.total * 100) : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, o FNS repassou ${fmt(atual.total)} ao Município de São Paulo para financiamento do SUS — o maior repasse anual da série.`,
      `O custeio de ações e serviços de saúde representou ${fmt(atual.custeio)} (${(atual.custeio / atual.total * 100).toFixed(0)}% do total); o investimento em estrutura da rede foi ${fmt(atual.investimento)}.`,
    ] : []),
    ...(growth !== null ? [
      `Entre 2020 e ${anoAtual}, os repasses cresceram +${growth.toFixed(0)}% em termos nominais — com queda em 2021–2022 (refluxo do custeio pandêmico) e recuperação a partir de 2023.`,
    ] : []),
    "Os repasses do FNS são transferências fundo-a-fundo: saem do Fundo Nacional de Saúde e entram diretamente no Fundo Municipal de Saúde de São Paulo, sem intermediação estadual.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={FNS_DATASET} />
      <JsonLd data={SP_SAUDE_BREADCRUMB} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Saúde · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Repasses federais de saúde (FNS) ao Município de São Paulo
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, o Fundo Nacional de Saúde repassou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.total)}</strong> ao Município de
                  São Paulo para financiar ações do SUS — custeio de serviços (UBS, hospitais, vigilância
                  sanitária) e investimento na rede de saúde.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Os repasses do FNS são transferências fundo-a-fundo: saem diretamente do Fundo Nacional de
                Saúde para o Fundo Municipal de Saúde sem passar pelo Estado. São Paulo, por ser o maior
                município do Brasil em população, recebe o maior volume absoluto de repasses de saúde do país.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota:</strong>{" "}
                  Estes dados mostram os repasses do FNS (fonte federal). O gasto municipal próprio em saúde
                  — complemento da prefeitura via orçamento municipal — está na{" "}
                  <Link href="/sao-paulo/executivo" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    página de orçamento (função saúde)
                  </Link>.
                  Os indicadores de responsabilidade fiscal (LRF) estão em{" "}
                  <Link href="/sao-paulo/saude-fiscal" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    Saúde Fiscal
                  </Link>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: `Total FNS ${anoAtual}`, valor: fmt(atual.total), nota: "Repasse bruto ao Fundo Municipal de Saúde" },
                  { label: "Custeio (SUS)",         valor: fmt(atual.custeio), nota: `${(atual.custeio / atual.total * 100).toFixed(0)}% do total — ações e serviços de saúde` },
                  { label: "Investimento (rede)",   valor: fmt(atual.investimento), nota: `${(atual.investimento / atual.total * 100).toFixed(1)}% — estruturação da rede de saúde` },
                ].map((item) => (
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
                <p className="uppercase font-semibold mb-4" style={S.label}>Repasses FNS 2020–{anoAtual}</p>
                <h2 style={S.h2}>Evolução dos repasses de saúde</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--teal-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
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
                        <p className="font-mono" style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(r.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Total repasses FNS por ano</p>
                <SerieHistorica data={serieChartData} unit="bi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Repasses FNS/FAF por ano</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Série histórica dos repasses do Fundo Nacional de Saúde ao Município de São Paulo.
              Formato CSV com blocos, grupos, estratégias, CNPJ da entidade receptora, valores brutos e líquidos.
            </p>
            <div className="flex flex-wrap gap-3">
              {[2025, 2024, 2023, 2022, 2021, 2020].map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_paulo/fns/saida/fns_repasses_faf_com_populacao_sao_paulo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: Fundo Nacional de Saúde (FNS/MS) — Fundo a Fundo (FAF). Valores nominais em BRL. Município 3550308 (São Paulo/SP).
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Como funciona o repasse fundo-a-fundo</p>
                <p style={S.body}>
                  O modelo fundo-a-fundo transfere recursos do Fundo Nacional de Saúde diretamente ao
                  Fundo Municipal de Saúde (FMS-SP), sem transitar pelo orçamento estadual. Esse mecanismo
                  garante rastreabilidade e vinculação do gasto: os recursos só podem ser utilizados nas
                  ações previstas no Programa Anual de Saúde (PAS) do município.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  Os repasses são organizados em dois grandes blocos: <strong>custeio</strong> (manutenção
                  de serviços como UBS, CAPS, SAMU, hospitais municipais e vigilância sanitária) e{" "}
                  <strong>investimento</strong> (obras, equipamentos e estruturação da rede). Historicamente,
                  o custeio responde por mais de 95% do total.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fontes dos dados</p>
                <p style={S.body}>
                  Repasses FNS/FAF: Portal do Fundo Nacional de Saúde (fns.saude.gov.br) — dados de
                  transferências fundo-a-fundo por município, desde 2020. Município de São Paulo:
                  código IBGE 3550308.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Por que o total difere do orçamento de saúde?</strong>{" "}
                  O orçamento municipal de saúde (RREO Anexo 02 — função 10) inclui tanto os repasses
                  federais quanto o aporte próprio da prefeitura (que pode ser até o dobro do repasse
                  federal em grandes municípios). Os dados desta página cobrem apenas a parcela federal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/saude/comparativo" className="nav-link">Série histórica SIOPS</Link>
            <Link href="/sao-paulo/saude-fiscal" className="nav-link">Saúde fiscal (LRF)</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/transferencias" className="nav-link">Transferências estaduais</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
