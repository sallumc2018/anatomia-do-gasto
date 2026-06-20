import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { datasetSchema, breadcrumbSchema, SITE_URL } from "@/lib/structured-data"

const SP_TRF_DATASET = datasetSchema({
  name: "Transferências estaduais ao Município de São Paulo 2020–2026",
  description: "Transferências do Governo do Estado de São Paulo ao Município: ICMS (cota-parte), IPVA, FUNDEB, IPI-exportação e demais repasses legais. Fonte: TCE-SP/Fazenda/SP. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/transferencias`,
  temporalCoverage: "2020/2026",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["transferências estaduais", "ICMS", "IPVA", "FUNDEB", "São Paulo", "repasses Estado"],
  dateModified: "2026-06-20",
  downloadUrls: [
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2020.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2021.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2022.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2023.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2024.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2025.csv`,
    `${SITE_URL}/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_2026.csv`,
  ],
})


const SP_TRANSFERENCIAS_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: "https://www.anatomiadogasto.ong.br" },
  { name: "São Paulo", url: "https://www.anatomiadogasto.ong.br/sao-paulo" },
  { name: "Transferências estaduais" },
])

export const metadata: Metadata = {
  title: "Transferências Intergovernamentais — São Paulo",
  description:
    "Repasses estaduais (ICMS, IPVA, IPI-Exportação) recebidos pelo Município de São Paulo. Série histórica 2020–2025. Fonte: Secretaria da Fazenda do Estado de SP.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/transferencias" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2020, 2021, 2022, 2023, 2024, 2025]

interface EstadualAnual {
  ano: number
  icms: number
  ipva: number
  ipi: number
  compensacoes: number
  total: number
}

function splitLine(line: string): string[] {
  const fields: string[] = []
  let cur = ""
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue }
    if (c === "," && !inQ) { fields.push(cur); cur = ""; continue }
    cur += c
  }
  fields.push(cur)
  return fields
}

function loadEstadualAnual(ano: number): EstadualAnual | null {
  const filePath = path.join(
    DATA_ROOT, "sao_paulo", "transferencias_estaduais", "saida",
    `transferencias_estaduais_sp_sao_paulo_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return null
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return null
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  for (const line of lines.slice(1)) {
    const f = splitLine(line)
    if ((f[col("periodo_tipo")] ?? "").trim() === "total_anual") {
      return {
        ano,
        icms:         parseFloat(f[col("icms")]         ?? "0") || 0,
        ipva:         parseFloat(f[col("ipva")]         ?? "0") || 0,
        ipi:          parseFloat(f[col("fund_exp_ipi")] ?? "0") || 0,
        compensacoes: parseFloat(f[col("compensacoes")] ?? "0") || 0,
        total:        parseFloat(f[col("total")]        ?? "0") || 0,
      }
    }
  }
  return null
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
    fontSize: "28px",
    lineHeight: "36px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "12px",
  } as React.CSSProperties,
  body:    { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function SaoPauloTransferenciasPage() {
  const estadualSerie: EstadualAnual[] = ANOS
    .map(loadEstadualAnual)
    .filter((r): r is EstadualAnual => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const anoAtual = estadualSerie[0]?.ano ?? 2025
  const atual = estadualSerie[0]

  const serieOrdenada = estadualSerie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: 0,
    liquidado: s.total,
  }))

  const s2020 = estadualSerie.find((s) => s.ano === 2020)
  const growth = s2020 && s2020.total > 0 && atual
    ? ((atual.total - s2020.total) / s2020.total * 100) : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, o Município de São Paulo recebeu ${fmt(atual.total)} em transferências estaduais — maior montante absoluto entre todos os municípios paulistas.`,
      `O ICMS sozinho representou ${fmt(atual.icms)}, equivalente a ${(atual.icms / atual.total * 100).toFixed(1)}% do total estadual transferido.`,
      `O IPVA foi de ${fmt(atual.ipva)}, reflexo da maior frota de veículos do Brasil concentrada na capital.`,
    ] : []),
    ...(growth !== null ? [
      `Entre 2020 e ${anoAtual}, as transferências estaduais cresceram +${growth.toFixed(0)}% em termos nominais.`,
    ] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SP_TRF_DATASET) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SP_TRANSFERENCIAS_BREADCRUMB) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Transferências · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Repasses estaduais recebidos pelo Município de São Paulo
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, o Município de São Paulo recebeu{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.total)}</strong> em transferências
                  estaduais (ICMS, IPVA, IPI-Exportação e compensações financeiras). O ICMS respondeu
                  por{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.icms)}</strong>.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Como maior município do Brasil e principal hub econômico nacional, São Paulo concentra
                o maior volume absoluto de ICMS gerado e recebido entre todos os municípios paulistas.
                A cota-parte do ICMS reflete a atividade industrial, comercial e de serviços da
                capital — mesmo que parte significativa da arrecadação seja retida pelo Estado.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota:</strong>{" "}
                  FPM, FUNDEB e transferências do SUS aparecem na{" "}
                  <Link href="/sao-paulo/receita" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    página de receitas
                  </Link>{" "}
                  (RREO Anexo 01 — SICONFI). Esta página mostra apenas as transferências estaduais
                  (Fazenda/SP — dados de repasse por município).
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
                  { label: `Total estadual ${anoAtual}`, valor: fmt(atual.total),         nota: "ICMS + IPVA + IPI-Exp + compensações" },
                  { label: "ICMS",                        valor: fmt(atual.icms),          nota: `${(atual.icms / atual.total * 100).toFixed(1)}% do total estadual` },
                  { label: "IPVA",                        valor: fmt(atual.ipva),          nota: `${(atual.ipva / atual.total * 100).toFixed(1)}% do total — maior frota do Brasil` },
                  { label: "IPI-Exportação",              valor: fmt(atual.ipi),           nota: "Fundo de compensação exportações" },
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

        {/* Série estadual */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Transferências estaduais 2020–{anoAtual}</p>
                <h2 style={S.h2}>Evolução dos repasses estaduais</h2>
                <div style={S.borderTop}>
                  {estadualSerie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>ICMS</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.icms)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>IPVA</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.ipva)}</p>
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
                <p style={{ ...S.label, marginBottom: "12px" }}>Total transferências estaduais por ano</p>
                <SerieHistorica data={serieChartData} unit="bi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Transferências estaduais por ano</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Série histórica dos repasses da Secretaria da Fazenda/SP ao Município de São Paulo.
              Formato CSV, campos: período, ICMS, IPVA, IPI-Exportação, compensações e total.
            </p>
            <div className="flex flex-wrap gap-3">
              {[2025, 2024, 2023, 2022, 2021, 2020].map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_paulo/transferencias_estaduais/saida/transferencias_estaduais_sp_sao_paulo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: Portal de Repasses da Secretaria da Fazenda do Estado de São Paulo (fazenda.sp.gov.br). Valores nominais em BRL.
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>ICMS e o peso econômico da capital</p>
                <p style={S.body}>
                  A cota-parte do ICMS é calculada com base na participação do município na arrecadação
                  estadual (3/4 do critério) e em indicadores socioeconômicos (1/4). São Paulo, como
                  centro financeiro e comercial do Brasil, concentra a maior parcela absoluta — mas
                  recebe menos <em>per capita</em> do que municípios menores com alto valor adicionado
                  industrial (como Paulínia), por conta dos critérios de redistribuição estadual.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fontes dos dados</p>
                <p style={S.body}>
                  Transferências estaduais: Portal de Repasses da Secretaria da Fazenda do Estado de
                  São Paulo (fazenda.sp.gov.br) — dados mensais desde 2020, município de São Paulo
                  (código Sefaz-SP 1004).
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Por que o valor difere do fluxo financeiro?</strong>{" "}
                  O <Link href="/fluxo-financeiro" style={{ color: "var(--text-03)", textDecoration: "underline" }}>fluxo financeiro</Link>{" "}
                  usa o RREO Anexo 01 (transferências estaduais correntes registradas pelo município no
                  SICONFI), enquanto esta página usa o valor bruto repassado pela Fazenda/SP. São fontes
                  distintas que medem o mesmo repasse em estágios diferentes — por isso os totais não
                  coincidem exatamente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/receita" className="nav-link">Receita municipal (SICONFI)</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
