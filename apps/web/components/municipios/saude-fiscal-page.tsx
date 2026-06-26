import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { PctRclChart, type PctRclPoint } from "@/components/charts/PctRclChart"
import {
  getAvailableYearsFiscal,
  loadPessoal,
  loadDivida,
  loadDividaDetalhada,
  type PessoalRow,
  type DividaRow,
} from "@/lib/data"

export interface SaudeFiscalPageConfig {
  dataMunicipio: string
  nome: string
  heroSubject: string
  structuredData: readonly unknown[]
  detailedDebt: boolean
  rppsLabel: string
  heroSourceText: string
  debtBaseHero: string
  debtBaseInsight: string
  debtBaseDcl: string
  debtKpiNote: string
  debtHeading: string
  debtExplanation: string
  debtChartLabel: string
  debtInsightSuffix?: string
  sourceCards: readonly { title: string; text: string }[]
  navLinks: readonly { href: string; label: string }[]
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

export function SaudeFiscalPage({ config }: { config: SaudeFiscalPageConfig }) {
  const anos = getAvailableYearsFiscal(config.dataMunicipio)
  const anoAtual = anos[0] ?? 2025

  const pessoalSerie: PessoalRow[] = anos
    .map((ano) => loadPessoal(ano, config.dataMunicipio))
    .filter((row): row is PessoalRow => row !== null)
    .sort((a, b) => a.ano - b.ano)
  const dividaSerie: DividaRow[] = anos
    .map((ano) => config.detailedDebt
      ? loadDividaDetalhada(ano, config.dataMunicipio)
      : loadDivida(ano, config.dataMunicipio))
    .filter((row): row is DividaRow => row !== null)
    .sort((a, b) => a.ano - b.ano)

  const pessoalAtual = pessoalSerie.find((r) => r.ano === anoAtual)
  const dividaAtual  = dividaSerie.find((r)  => r.ano === anoAtual)

  const pessoalChartData: PctRclPoint[] = pessoalSerie.map((r) => ({ ano: String(r.ano), valor: r.dtp_pct_rcl }))
  const dividaChartData:  PctRclPoint[] = dividaSerie.map((r)  => ({ ano: String(r.ano), valor: r.dc_pct_rcl }))

  const pessoal2020 = pessoalSerie.find((r) => r.ano === 2020)
  const pessoalInsights: string[] = [
    ...(pessoalAtual ? [
      `Em ${anoAtual}, ${config.nome} gastou ${pessoalAtual.dtp_pct_rcl.toFixed(2)}% da RCL ajustada com pessoal — o limite legal para o Executivo é 54% (LRF art. 20). A margem disponível é de ${(pessoalAtual.limite_maximo_pct - pessoalAtual.dtp_pct_rcl).toFixed(2)} pontos percentuais.`,
      `Do total, ${fmt(pessoalAtual.pessoal_ativo)} foram com pessoal ativo e ${fmt(pessoalAtual.pessoal_inativo)} com inativos e pensionistas (${config.rppsLabel}).`,
    ] : []),
    ...(pessoal2020 && pessoalAtual ? [
      `Em 2020, a despesa com pessoal era ${pessoal2020.dtp_pct_rcl.toFixed(2)}% da RCL ajustada. Em ${anoAtual} o índice está em ${pessoalAtual.dtp_pct_rcl.toFixed(2)}%.`,
    ] : []),
  ]

  const dividaInsights: string[] = [
    ...(dividaAtual ? [
      `A dívida consolidada bruta de ${config.heroSubject} em ${anoAtual} era de ${fmt(dividaAtual.dc_bruta)} (${dividaAtual.dc_pct_rcl.toFixed(1)}% da ${config.debtBaseInsight}). O limite fixado pela Resolução do Senado Federal 40/2001 é de 120%.`,
      `A dívida consolidada líquida (DCL) foi de ${fmt(dividaAtual.dcl)} (${dividaAtual.dcl_pct_rcl.toFixed(2)}% da ${config.debtBaseDcl}).${config.debtInsightSuffix ?? ""}`,
    ] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {config.structuredData.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Saúde Fiscal · {config.nome}/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Limites fiscais e sustentabilidade das finanças municipais
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                A Lei de Responsabilidade Fiscal (LRF) estabelece limites para despesa com pessoal
                e endividamento dos municípios. Em {anoAtual}, {config.heroSubject} gastou{" "}
                <strong style={{ color: "var(--text-01)" }}>{pessoalAtual?.dtp_pct_rcl.toFixed(2) ?? "—"}%</strong> da
                RCL ajustada com pessoal (limite: 54%) e manteve dívida de{" "}
                <strong style={{ color: "var(--text-01)" }}>{dividaAtual?.dc_pct_rcl.toFixed(1) ?? "—"}%</strong> da
                {config.debtBaseHero} (limite: 120%).
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                {config.heroSourceText}
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
                { label: "Dívida consolidada bruta",    valor: dividaAtual  ? `${dividaAtual.dc_pct_rcl.toFixed(1)}%` : "—",  nota: config.debtKpiNote },
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
                      e {fmt(pessoalAtual.pessoal_inativo)} com inativos e pensionistas do {config.rppsLabel}.
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
                <h2 style={S.h2}>{config.debtHeading}</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  {config.debtExplanation}
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
                <p style={{ ...S.label, marginBottom: "12px" }}>{config.debtChartLabel}</p>
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
              {config.sourceCards.map((card) => (
                <div key={card.title}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)", marginBottom: "8px" }}>{card.title}</p>
                  <p style={S.body}>{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            {config.navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
