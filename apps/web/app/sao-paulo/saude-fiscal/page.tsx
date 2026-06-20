import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { PctRclChart, type PctRclPoint } from "@/components/charts/PctRclChart"
import {
  getAvailableYearsFiscal,
  loadPessoal,
  loadDividaDetalhada,
  type PessoalRow,
  type DividaDetalhadaRow,
} from "@/lib/data"
import { datasetSchema, SITE_URL } from "@/lib/structured-data"

const SP_FIS_DATASET = datasetSchema({
  name: "Saúde fiscal (LRF/RGF) — São Paulo 2020–2025",
  description: "Indicadores de responsabilidade fiscal de São Paulo conforme a Lei de Responsabilidade Fiscal: despesa com pessoal, dívida consolidada, Receita Corrente Líquida (RCL) e verificação dos limites legais. Fonte: RGF/SICONFI. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/saude-fiscal`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["LRF", "Lei de Responsabilidade Fiscal", "RGF", "despesa com pessoal", "dívida consolidada", "RCL", "São Paulo"],
  dateModified: "2026-06-20",
  downloadUrls: [
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2020.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2021.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2022.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2023.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2024.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/pessoal_sao_paulo_2025.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2020.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2021.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2022.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2023.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2024.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/divida_sao_paulo_2025.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2020.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2021.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2022.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2023.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2024.csv`,
    `${SITE_URL}/api/dados/sao_paulo/fiscal/saida/rcl_sao_paulo_2025.csv`,
  ],
})

const MUNICIPIO = "sao_paulo"

export const metadata: Metadata = {
  title: "Saúde Fiscal de São Paulo",
  description:
    "Despesa com pessoal, dívida consolidada e Receita Corrente Líquida de São Paulo 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/saude-fiscal" },
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

function StatusBadge({ pct, limite, label }: { pct: number; limite: number; label: string }) {
  const pct90 = limite * 0.90
  const pct95 = limite * 0.95
  const isOver  = pct >= limite
  const isPrud  = pct >= pct95
  const isAlert = pct >= pct90
  const color = isOver ? "#da1e28" : isPrud ? "#f1c21b" : isAlert ? "#f1c21b" : "#24a148"
  const text  = isOver ? "Acima do limite" : isPrud ? "Limite prudencial" : isAlert ? "Alerta" : "Dentro do limite"
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color, border: `1px solid ${color}`, padding: "2px 8px" }}>
      {label}: {text}
    </span>
  )
}

export default function SaoPauloSaudeFiscalPage() {
  const anos = getAvailableYearsFiscal(MUNICIPIO)
  const anoAtual = anos[0] ?? 2025

  const pessoalSerie: PessoalRow[]         = anos.map((a) => loadPessoal(a, MUNICIPIO)).filter((r): r is PessoalRow => r !== null).sort((a, b) => a.ano - b.ano)
  const dividaSerie:  DividaDetalhadaRow[] = anos.map((a) => loadDividaDetalhada(a, MUNICIPIO)).filter((r): r is DividaDetalhadaRow => r !== null).sort((a, b) => a.ano - b.ano)

  const pessoalAtual = pessoalSerie.find((r) => r.ano === anoAtual)
  const dividaAtual  = dividaSerie.find((r)  => r.ano === anoAtual)

  const pessoalChartData: PctRclPoint[] = pessoalSerie.map((r) => ({ ano: String(r.ano), valor: r.dtp_pct_rcl }))
  const dividaChartData:  PctRclPoint[] = dividaSerie.map((r)  => ({ ano: String(r.ano), valor: r.dc_pct_rcl }))

  const pessoal2020 = pessoalSerie.find((r) => r.ano === 2020)
  const pessoalInsights: string[] = [
    ...(pessoalAtual ? [
      `Em ${anoAtual}, São Paulo gastou ${pessoalAtual.dtp_pct_rcl.toFixed(2)}% da RCL ajustada com pessoal — o limite legal para o Executivo é 54% (LRF art. 20). A margem disponível é de ${(pessoalAtual.limite_maximo_pct - pessoalAtual.dtp_pct_rcl).toFixed(2)} pontos percentuais.`,
      `Do total, ${fmt(pessoalAtual.pessoal_ativo)} foram com pessoal ativo e ${fmt(pessoalAtual.pessoal_inativo)} com inativos e pensionistas (RPPS municipal).`,
    ] : []),
    ...(pessoal2020 && pessoalAtual ? [
      `Em 2020, a despesa com pessoal era ${pessoal2020.dtp_pct_rcl.toFixed(2)}% da RCL ajustada. Em ${anoAtual} o índice está em ${pessoalAtual.dtp_pct_rcl.toFixed(2)}%.`,
    ] : []),
  ]

  const dividaInsights: string[] = [
    ...(dividaAtual ? [
      `A dívida consolidada bruta de São Paulo em ${anoAtual} era de ${fmt(dividaAtual.dc_bruta)} (${dividaAtual.dc_pct_rcl.toFixed(1)}% da base ajustada informada no RGF). O limite fixado pela Resolução do Senado Federal 40/2001 é de 120%.`,
      `A dívida consolidada líquida (DCL) foi de ${fmt(dividaAtual.dcl)} (${dividaAtual.dcl_pct_rcl.toFixed(2)}% da base ajustada informada no RGF).`,
    ] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SP_FIS_DATASET) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Saúde Fiscal · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Limites fiscais e sustentabilidade das finanças municipais
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                A Lei de Responsabilidade Fiscal (LRF) estabelece limites para despesa com pessoal
                e endividamento dos municípios. Em {anoAtual}, São Paulo gastou{" "}
                <strong style={{ color: "var(--text-01)" }}>{pessoalAtual?.dtp_pct_rcl.toFixed(2) ?? "—"}%</strong> da
                RCL ajustada com pessoal (limite: 54%) e manteve dívida de{" "}
                <strong style={{ color: "var(--text-01)" }}>{dividaAtual?.dc_pct_rcl.toFixed(1) ?? "—"}%</strong> da
                base ajustada do RGF (limite: 120%).
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados extraídos do RGF (Relatório de Gestão Fiscal) e do RREO publicados no SICONFI pelo Tesouro Nacional.
              </p>
              <div className="flex flex-wrap gap-3">
                {pessoalAtual && <StatusBadge pct={pessoalAtual.dtp_pct_rcl} limite={pessoalAtual.limite_maximo_pct} label="Pessoal" />}
                {dividaAtual  && <StatusBadge pct={dividaAtual.dc_pct_rcl}   limite={120}  label="Dívida" />}
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: `RCL ${anoAtual}`,           valor: pessoalAtual ? fmt(pessoalAtual.rcl) : "—",              nota: "Receita Corrente Líquida oficial" },
                { label: "RCL ajustada",               valor: pessoalAtual ? fmt(pessoalAtual.rcl_ajustada) : "—",     nota: "Base usada no limite de pessoal" },
                { label: "Despesa com pessoal",         valor: pessoalAtual ? `${pessoalAtual.dtp_pct_rcl.toFixed(2)}%` : "—", nota: `da RCL ajustada — limite: ${pessoalAtual?.limite_maximo_pct ?? 54}%` },
                { label: "Dívida consolidada bruta",    valor: dividaAtual  ? `${dividaAtual.dc_pct_rcl.toFixed(1)}%` : "—",  nota: "da base ajustada do RGF — limite: 120%" },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "28px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>{item.valor}</p>
                  <p className="mt-1" style={S.caption}>{item.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RCL série */}
        <section id="rcl" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Receita Corrente Líquida 2020–{anoAtual}</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Evolução da RCL e base ajustada</h2>
            <div style={S.borderTop}>
              {pessoalSerie.slice().reverse().map((r) => (
                <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                  <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                    {r.ano}
                  </span>
                  <div className="flex items-center gap-6">
                    <span style={{ fontSize: "12px", color: "var(--text-04)" }}>RCL {fmt(r.rcl)}</span>
                    <span className="font-mono" style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "100px", textAlign: "right" }}>
                      aj. {fmt(r.rcl_ajustada)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Despesa com Pessoal */}
        <section id="pessoal" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Despesa com pessoal 2020–{anoAtual}</p>
                <h2 style={S.h2}>Folha de pagamento como % da RCL ajustada</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O limite legal para o Executivo Municipal é 54% da RCL ajustada (LRF art. 20, III, b).
                  O limite prudencial é 95% desse valor (≈51,3%) e o de alerta é 90% (≈48,6%).
                </p>
                <div style={S.borderTop}>
                  {pessoalSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>{fmt(r.dtp)}</span>
                        <span className="font-mono" style={{ fontSize: "13px", color: r.dtp_pct_rcl >= 48.6 ? "#f1c21b" : "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "56px", textAlign: "right" }}>
                          {r.dtp_pct_rcl.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={pessoalInsights} />
              </div>
              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>% da RCL ajustada com pessoal — limite: 54%</p>
                <PctRclChart data={pessoalChartData} limite={54} limiteLabel="Limite LRF 54%" limitePrudencial={51.3} />
                {pessoalAtual && (
                  <div className="mt-4 p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      <strong style={{ color: "var(--text-02)" }}>Ativo vs. Inativo:</strong>{" "}
                      Em {anoAtual}, {fmt(pessoalAtual.pessoal_ativo)} foram com pessoal ativo
                      e {fmt(pessoalAtual.pessoal_inativo)} com inativos e pensionistas do RPPS municipal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Dívida */}
        <section id="divida" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Dívida consolidada 2020–{anoAtual}</p>
                <h2 style={S.h2}>Endividamento como % da base ajustada</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O limite máximo é 120% da base ajustada informada no RGF (Resolução do Senado 40/2001).
                  A DCL desconta as disponibilidades de caixa do total da dívida consolidada.
                </p>
                <div style={S.borderTop}>
                  {dividaSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>bruta {fmt(r.dc_bruta)}</span>
                        <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "56px", textAlign: "right" }}>
                          {r.dc_pct_rcl.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={dividaInsights} />
              </div>
              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>DC bruta % da base ajustada — limite: 120%</p>
                <PctRclChart data={dividaChartData} limite={120} limiteLabel="Limite Senado 120%" barColor="#78a9ff" />
              </div>
            </div>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Fontes declaradas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>RGF Anexo 01</p>
                <p style={S.body}>Despesa com Pessoal — Relatório de Gestão Fiscal do Poder Executivo, periocidade semestral.</p>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>RGF Anexo 02</p>
                <p style={S.body}>Dívida Consolidada e Deduções — Relatório de Gestão Fiscal do Poder Executivo, semestral.</p>
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>RREO Anexo 03</p>
                <p style={S.body}>Demonstrativo da Receita Corrente Líquida — publicado bimestralmente no SICONFI.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/receita" className="nav-link">Receitas</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
