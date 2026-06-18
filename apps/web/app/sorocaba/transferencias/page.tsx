import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { loadSubvencoesPorEntidade, loadConveniosFederais, loadStateTransferResumo } from "@/lib/data"
import { TransferCharts } from "./TransferCharts"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Parcerias com o Terceiro Setor e Transferências · Transparência",
  description:
    "Valores repassados pela Prefeitura de Sorocaba a entidades civis (OSCs) e fluxo de transferências estaduais e federais.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/transferencias" },
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
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

export default function TransferenciasPage() {
  const subvencoes = loadSubvencoesPorEntidade("sorocaba")
  const convenios = loadConveniosFederais("sorocaba")
  const stateResumo = loadStateTransferResumo("sorocaba")

  // Aggregate federal transfers by year
  const fedByYear = convenios.reduce((acc, curr) => {
    acc[curr.ano] = (acc[curr.ano] || 0) + curr.valor_transferido
    return acc
  }, {} as Record<number, number>)

  // Aggregate state transfers by year
  const stateByYear = stateResumo.reduce((acc, curr) => {
    acc[curr.ano] = (acc[curr.ano] || 0) + curr.arrecadado_acumulado
    return acc
  }, {} as Record<number, number>)

  // Extract list of all unique years
  const years = Array.from(new Set([
    ...Object.keys(fedByYear).map(Number),
    ...Object.keys(stateByYear).map(Number)
  ])).sort((a, b) => b - a)

  // Map into combined inbound format
  const inboundTransfers = years
    .map(year => ({
      year,
      federal: fedByYear[year] || 0,
      estadual: stateByYear[year] || 0,
      total: (fedByYear[year] || 0) + (stateByYear[year] || 0)
    }))
    .sort((a, b) => a.year - b.year)

  // Get available subvention years
  const availableYears = Array.from(new Set(subvencoes.map((s) => s.ano)))
    .filter(Boolean)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--theme-accent)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Pacto Federativo & Parcerias</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}
              >
                Transferências Inbound e Repasses ao Terceiro Setor
              </h1>
              <p style={{ ...S.body, maxWidth: "680px", marginBottom: "16px" }}>
                Entenda o fluxo financeiro externo de Sorocaba/SP. Audite as transferências que o município capta 
                da União e do Estado de São Paulo, e veja detalhadamente como o orçamento municipal financia 
                serviços públicos vitais de saúde e educação prestados por Organizações da Sociedade Civil (OSCs).
              </p>
              <p style={S.caption}>
                Fontes: SICONFI/Tesouro Nacional (Balanços e RREO 2020–2025) · Convênios Federais (Portal da Transparência) · Repasses Sociais declarados (TCE-SP).
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Dashboards */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <TransferCharts 
              subvencoes={subvencoes} 
              inboundTransfers={inboundTransfers} 
              availableYears={availableYears} 
            />
          </div>
        </section>

        {/* Navigation Footer */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sorocaba/controle-externo" className="nav-link">Controle Externo</Link>
            <Link href="/sorocaba/camara-municipal" className="nav-link">Câmara Municipal</Link>
            <Link href="/sorocaba/saude-fiscal" className="nav-link">Saúde Fiscal</Link>
            <Link href="/" className="nav-link">← Voltar para o painel</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
