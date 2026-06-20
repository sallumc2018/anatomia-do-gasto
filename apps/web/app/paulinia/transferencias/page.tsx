import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { datasetSchema, breadcrumbSchema } from "@/lib/structured-data"

const PAU_TRF_DATASET = datasetSchema({
  name: "Transferências intergovernamentais — Paulínia 2020–2024",
  description: "Transferências da União e do Estado de São Paulo ao Município de Paulínia: FPM, ICMS, IPVA, FUNDEB, royalties REPLAN. Fonte: SICONFI/TCE-SP. IBGE 3536505.",
  url: `https://www.anatomiadogasto.ong.br/paulinia/transferencias`,
  temporalCoverage: "2020/2024",
  spatialCoverage: "Paulínia, SP, Brasil (IBGE 3536505)",
  keywords: ["transferências", "FPM", "ICMS", "REPLAN", "royalties", "Paulínia"],
  dateModified: "2026-06-20",
  downloadUrls: [
    `https://www.anatomiadogasto.ong.br/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_2020.csv`,
    `https://www.anatomiadogasto.ong.br/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_2021.csv`,
    `https://www.anatomiadogasto.ong.br/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_2022.csv`,
    `https://www.anatomiadogasto.ong.br/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_2023.csv`,
    `https://www.anatomiadogasto.ong.br/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_2024.csv`,
  ],
})

const PAU_TRF_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: "https://www.anatomiadogasto.ong.br" },
  { name: "Paulínia", url: "https://www.anatomiadogasto.ong.br/paulinia" },
  { name: "Transferências" },
])

export const metadata: Metadata = {
  title: "Transferências Intergovernamentais — Paulínia",
  description:
    "Repasses estaduais (ICMS, IPVA, IPI-Exportação) e federais recebidos por Paulínia/SP. Série histórica 2020–2025. Fontes: Fazenda/SP e Portal da Transparência Federal.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia/transferencias" },
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

interface FederalConvenio {
  ano: number
  orgao: string
  acao: string
  valor: number
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
    DATA_ROOT, "paulinia", "transferencias_estaduais", "saida",
    `transferencias_estaduais_sp_paulinia_${ano}.csv`
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

function loadFederaisConvenios(ano: number): FederalConvenio[] {
  const filePath = path.join(
    DATA_ROOT, "paulinia", "transferencias_federais", "saida",
    `transferencias_federais_paulinia_${ano}.csv`
  )
  if (!fs.existsSync(filePath)) return []
  const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitLine(lines[0]).map((h) => h.trim().toLowerCase())
  const col = (name: string) => headers.indexOf(name)
  return lines.slice(1).map((line) => {
    const f = splitLine(line)
    return {
      ano,
      orgao: (f[col("orgao_superior_nome")] ?? "").trim(),
      acao:  (f[col("acao_descricao")]      ?? "").trim(),
      valor:  parseFloat(f[col("valor_transferido")] ?? "0") || 0,
    }
  }).filter((r) => r.valor > 0)
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

export default function PauliniaTransferenciasPage() {
  const estadualSerie: EstadualAnual[] = ANOS
    .map(loadEstadualAnual)
    .filter((r): r is EstadualAnual => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const anoAtual = estadualSerie[0]?.ano ?? 2025
  const atual = estadualSerie[0]

  const allConvenios: FederalConvenio[] = ANOS.flatMap(loadFederaisConvenios)
    .sort((a, b) => b.valor - a.valor)

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
      `Em ${anoAtual}, Paulínia recebeu ${fmt(atual.total)} em transferências estaduais — o ICMS sozinho respondeu por ${(atual.icms / atual.total * 100).toFixed(1)}% desse total.`,
      `O IPVA transferido foi de ${fmt(atual.ipva)}, reflexo do alto volume de veículos cadastrados em Paulínia como sede de indústrias petroquímicas.`,
    ] : []),
    ...(growth !== null ? [
      `Entre 2020 e ${anoAtual}, as transferências estaduais cresceram +${growth.toFixed(0)}% — passando de ${fmt(s2020!.total)} para ${fmt(atual!.total)}.`,
    ] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAU_TRF_DATASET) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAU_TRF_BREADCRUMB) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Transferências · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Repasses estaduais e federais recebidos por Paulínia
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, Paulínia recebeu{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.total)}</strong> em transferências estaduais
                  (ICMS, IPVA, IPI-Exportação). O ICMS sozinho representou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.icms)}</strong>.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Paulínia concentra a maior refinaria da América Latina (Replan/Petrobras) e é sede de um
                polo petroquímico expressivo, o que explica por que recebe uma das maiores cotas de ICMS
                per capita do Estado de São Paulo — muito acima de municípios de porte similar.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota:</strong>{" "}
                  FPM, FUNDEB e transferências do SUS aparecem na{" "}
                  <Link href="/paulinia/receita" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    página de receitas
                  </Link>{" "}
                  (RREO Anexo 01). Esta página mostra as transferências estaduais (Fazenda/SP) e convênios
                  federais do Portal da Transparência.
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
                  { label: "ICMS",                        valor: fmt(atual.icms),          nota: `${(atual.icms / atual.total * 100).toFixed(1)}% do total` },
                  { label: "IPVA",                        valor: fmt(atual.ipva),          nota: `${(atual.ipva / atual.total * 100).toFixed(1)}% do total` },
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

        {/* Convênios federais */}
        {allConvenios.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Convênios federais — Portal da Transparência</p>
              <h2 style={{ ...S.h2, fontSize: "20px" }}>Repasses federais via convênio</h2>
              <p style={{ ...S.body, marginBottom: "24px", maxWidth: "640px" }}>
                Convênios e instrumentos firmados com o Governo Federal. Não inclui FPM, FUNDEB, SUS
                (que aparecem via SICONFI na página de receitas).
              </p>
              <div style={S.borderTop}>
                {allConvenios.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-6 py-3" style={S.borderBottom}>
                    <div className="flex-1">
                      <p style={{ fontSize: "13px", color: "var(--text-01)" }}>{r.orgao}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-03)", marginTop: "2px" }}>{r.acao.slice(0, 120)}{r.acao.length > 120 ? "…" : ""}</p>
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)" }}>{fmt(r.valor)}</p>
                      <p style={{ ...S.caption, marginTop: "2px" }}>{r.ano}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4" style={S.caption}>
                Fonte: Portal da Transparência Federal — API Convênios. Valores nominais.
              </p>
            </div>
          </section>
        )}

        {/* Downloads consolidados */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Transferências consolidadas por ano</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Visão unificada das transferências recebidas por Paulínia: convênios federais (Portal da
              Transparência) + repasses do Fundo Nacional de Saúde (FNS/FAF). Formato CSV, campos:
              fonte, categoria, órgão remetente, descrição e valor.
            </p>
            <div className="flex flex-wrap gap-3">
              {[2025, 2024, 2023, 2022, 2021, 2020].map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/paulinia/transferencias/saida/transferencias_para_paulinia_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fontes: Portal da Transparência Federal (API Convênios) e FNS/FAF (saude.gov.br). Valores nominais em BRL.
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Caso Paulínia — ICMS combustíveis</p>
                <p style={S.body}>
                  A cota-parte do ICMS sobre combustíveis é a maior fonte de transferências estaduais
                  para Paulínia. A Replan (Refinaria do Planalto) da Petrobras processa combustíveis
                  que geram tributos na cidade. Em 2024, as transferências estaduais representaram
                  mais de {atual ? (atual.total / 2816 * 100).toFixed(0) : "—"}% da receita corrente
                  exceto intra-orçamentárias do município.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fontes dos dados</p>
                <p style={S.body}>
                  Transferências estaduais: Portal de Repasses da Secretaria da Fazenda do Estado de
                  São Paulo (fazenda.sp.gov.br) — dados mensais desde 2020.
                  Convênios federais: API do Portal da Transparência Federal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/receita" className="nav-link">Receita municipal (SICONFI)</Link>
            <Link href="/paulinia/executivo" className="nav-link">Orçamento total</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
