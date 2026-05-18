import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsTransporte,
  loadTransporteOrcamento,
  loadTransporteDca,
} from "@/lib/data"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { TrackedReportLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Função Transporte em Sorocaba",
  description: "Execução orçamentária da função transporte em Sorocaba 2020–2025: liquidado, pago e fontes RREO+DCA/SICONFI por ano. Limitação declarada: subfunção única, não isola ônibus de obras viárias.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/transporte" },
  openGraph: {
    title: "Função Transporte em Sorocaba | Anatomia do Gasto",
    description: "Execução orçamentária da função transporte em Sorocaba 2020–2025: liquidado, pago e fontes RREO+DCA/SICONFI por ano.",
    url: "https://www.anatomiadogasto.ong.br/sorocaba/transporte",
  },
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
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
}

export default function TransportePage() {
  const years = getAvailableYearsTransporte()
  const latestYear = years[0]
  const latestOrcamento = latestYear ? loadTransporteOrcamento(latestYear) : null
  const latestDca = latestYear ? loadTransporteDca(latestYear) : null

  const yearRange =
    years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}`
    : years.length === 1 ? String(years[0])
    : "—"

  const taxaExecucao = latestOrcamento && latestOrcamento.dotacao_atualizada > 0
    ? (latestOrcamento.empenhado / latestOrcamento.dotacao_atualizada) * 100
    : null

  const chartYears = [...years].reverse()
  const totalAnualData: TotalAnualPoint[] = chartYears.map((year) => {
    const dca = loadTransporteDca(year)
    return { year: String(year), total: dca?.liquidado ?? 0 }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Função Transporte em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                Orçamento anual da função Transporte (função 26) declarado ao Tesouro Nacional
                via SICONFI — RREO Anexo 02 e DCA Anexo I-E.
              </p>
              <p className="font-mono text-sm mb-8" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Transporte · {yearRange}
              </p>

              <p className="mt-2" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
                <strong style={{ color: "var(--text-03)" }}>Limitação:</strong> Sorocaba declara toda a função 26 em uma
                única subfunção (&ldquo;FU26 — Demais Subfunções&rdquo;). Os valores incluem transporte
                público urbano (ônibus/URBES) e obras de infraestrutura viária sem discriminação.
                Não é possível isolar só o serviço de ônibus a partir desta fonte.
              </p>
            </div>
          </div>
        </section>

        {/* ── Métricas do ano mais recente ──────────────────────────────────── */}
        {latestOrcamento && (
          <section style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p style={S.label} className="mb-6">Função 26 — Transporte · {latestYear} · RREO Anexo 02</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p style={S.label} className="mb-1">Dotação atualizada</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)" }}>
                    {formatMillions(latestOrcamento.dotacao_atualizada)}
                  </p>
                </div>
                <div>
                  <p style={S.label} className="mb-1">Empenhado</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)" }}>
                    {formatMillions(latestOrcamento.empenhado)}
                  </p>
                </div>
                <div>
                  <p style={S.label} className="mb-1">Taxa de execução</p>
                  <p className="font-light" style={{
                    fontSize: "24px",
                    color: taxaExecucao !== null && taxaExecucao > 95
                      ? "var(--yellow-60, #b45309)"
                      : "var(--text-01)",
                  }}>
                    {taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—"}
                  </p>
                  {taxaExecucao !== null && taxaExecucao > 95 && (
                    <p style={{ fontSize: "11px", color: "var(--yellow-60, #b45309)" }}>
                      padrão desta função (ver nota)
                    </p>
                  )}
                </div>
                <div>
                  <p style={S.label} className="mb-1">% do orçamento municipal</p>
                  <p className="font-light" style={{ fontSize: "24px", color: "var(--text-01)" }}>
                    {latestOrcamento.pct_orcamento.toFixed(2)}%
                  </p>
                </div>
              </div>
              {latestDca && (
                <p className="mt-4" style={S.caption}>
                  DCA — Pago: {formatPrecise(latestDca.pago)} · Liquidado: {formatPrecise(latestDca.liquidado)}
                </p>
              )}

              {/* Nota taxa de execução alta */}
              <p className="mt-6" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "760px" }}>
                <strong style={{ color: "var(--text-03)" }}>Nota — taxa de execução &gt;95%:</strong> a função 26 apresenta execução
                acima de 95% em 2021–2025. Isso sugere que a dotação atualizada é reajustada
                ao longo do ano via créditos adicionais para cobrir o subsídio ao transporte público,
                não necessariamente que o orçamento inicial foi bem dimensionado.
              </p>
            </div>
          </section>
        )}

        {/* ── Gráfico histórico ─────────────────────────────────────────────── */}
        {totalAnualData.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)" }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <h2 className="font-light mb-2" style={S.h2}>Evolução do gasto liquidado</h2>
              <p className="mb-6" style={S.caption}>
                Função 26 — Transporte · DCA Anexo I-E · Sorocaba/SP
              </p>
              <TotalAnual data={totalAnualData} />
            </div>
          </section>
        )}

        {/* ── Relatórios disponíveis ────────────────────────────────────────── */}
        <section id="consultar" style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Relatórios disponíveis</h2>
            {years.length === 0 ? (
              <p style={S.body}>Nenhum dado disponível.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {years.map((year) => {
                  const orc = loadTransporteOrcamento(year)
                  return (
                    <TrackedReportLink
                      key={year}
                      href={`/sorocaba/transporte/relatorio/${year}`}
                      area="transporte"
                      year={year}
                      className="tile-link"
                      style={{ border: "1px solid var(--border-01)", borderRadius: "8px" }}
                    >
                      <div style={{ padding: "20px" }}>
                        <p style={S.label}>{year}</p>
                        {orc ? (
                          <p className="mt-2 font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                            {formatMillions(orc.empenhado)}
                          </p>
                        ) : (
                          <p className="mt-2" style={S.caption}>sem dado RREO</p>
                        )}
                        <p style={S.caption} className="mt-1">empenhado EXCETO INTRA</p>
                      </div>
                    </TrackedReportLink>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── O que este dado não mostra ────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <h2 className="font-light mb-6" style={S.h2}>O que este dado não mostra</h2>
            <ul style={{ ...S.body, listStyle: "disc", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <strong>Breakdown por tipo:</strong> transporte público urbano vs obras viárias vs outros —
                a subfunção única não permite essa distinção.
              </li>
              <li>
                <strong>Operação do serviço:</strong> frota (418 veículos/URBES), linhas (132),
                passageiros/mês (~4M), confiabilidade, pontualidade. A URBES não publica dados abertos.
              </li>
              <li>
                <strong>Tarifa histórica:</strong> reajustes e estrutura tarifária disponíveis apenas
                em decretos PDF no portal municipal, sem série automatizável.
              </li>
              <li>
                <strong>Contratos:</strong> o PNCP indexa contratos a partir de ~2022 e requer
                curadoria manual por não ter campo de categoria &ldquo;transporte público&rdquo;.
              </li>
              <li>
                <strong>Serviços intermunicipais (EMTU/SP):</strong> linhas metropolitanas operadas
                pelo Estado de São Paulo não estão incluídas no orçamento municipal.
              </li>
            </ul>

            <div className="mt-8 flex gap-4 flex-wrap">
              <Link
                href="/sorocaba/transporte/comparativo"
                className="inline-block px-5 py-2 text-sm font-medium"
                style={{ border: "1px solid var(--border-01)", borderRadius: "6px", color: "var(--text-02)" }}
              >
                Ver comparativo histórico
              </Link>
              <a
                href="https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2 text-sm"
                style={{ color: "var(--blue-60)" }}
              >
                Fonte: SICONFI/RREO ↗
              </a>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
