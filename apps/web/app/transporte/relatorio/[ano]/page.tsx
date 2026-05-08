import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatPrecise,
  getAvailableYearsTransporte,
  loadTransporteOrcamento,
  loadTransporteDca,
} from "@/lib/data"

interface PageProps {
  params: Promise<{ ano: string }>
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
    fontSize: "22px",
    lineHeight: "30px",
    color: "var(--text-01)",
    fontWeight: 400,
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
  info: {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-01)",
    borderRadius: "6px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "var(--text-02)",
  } as React.CSSProperties,
}

export async function generateStaticParams() {
  const years = getAvailableYearsTransporte()
  return years.map((year) => ({ ano: String(year) }))
}

export default async function TransporteRelatorioPage({ params }: PageProps) {
  const { ano } = await params
  if (!/^\d{4}$/.test(ano)) notFound()
  const year = parseInt(ano)
  const years = getAvailableYearsTransporte()
  if (!years.includes(year)) notFound()

  const orcamento = loadTransporteOrcamento(year)
  const dca = loadTransporteDca(year)

  const taxaExecucao = orcamento && orcamento.dotacao_atualizada > 0
    ? (orcamento.empenhado / orcamento.dotacao_atualizada) * 100
    : null

  const taxaColor = taxaExecucao === null
    ? "var(--text-01)"
    : taxaExecucao >= 85
    ? "var(--green-60, #16a34a)"
    : taxaExecucao < 70
    ? "var(--red-60, #dc2626)"
    : "var(--yellow-60, #b45309)"

  const prevYear = year - 1
  const nextYear = year + 1
  const hasPrev = years.includes(prevYear)
  const hasNext = years.includes(nextYear)

  const is2021Anomaly = year === 2021

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-3" style={S.container}>
            <nav style={S.caption}>
              <Link href="/transporte" style={{ color: "var(--blue-60)" }}>Transporte</Link>
              {" › "}
              <span>Relatório {year}</span>
            </nav>
          </div>
        </div>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={S.label} className="mb-3">Função 26 — Transporte · Sorocaba/SP</p>
            <h1 className="font-light mb-2" style={{ fontSize: "36px", color: "var(--text-01)" }}>
              Relatório {year}
            </h1>
            <p style={S.body}>
              Orçamento e execução orçamentária da função Transporte, com base no
              RREO Anexo 02 (bimestre 6) e DCA Anexo I-E do SICONFI.
            </p>

            {/* Limitação sempre visível */}
            <p className="mt-4" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
              <strong style={{ color: "var(--text-03)" }}>Limitação desta fonte:</strong> Sorocaba declara toda a função 26 em
              uma única subfunção (&ldquo;FU26 — Demais Subfunções&rdquo;). Os valores abaixo incluem
              transporte público urbano (ônibus/URBES) e obras viárias sem discriminação.
              {is2021Anomaly && (
                <>
                  {" "}
                  <strong style={{ color: "var(--text-03)" }}>2021 — anomalia de dotação:</strong> neste exercício a dotação atualizada
                  foi R$&nbsp;3M, contra R$&nbsp;101M em 2020 e R$&nbsp;404M em 2022. A causa
                  não foi identificada nos dados federais — possível mudança na forma de
                  contabilização do subsídio ou reclassificação orçamentária.
                </>
              )}
            </p>
          </div>
        </section>

        {/* ── RREO — Dotação e Execução ─────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <h2 style={S.h2} className="mb-2">Orçamento — RREO Anexo 02</h2>
            <p className="mb-8" style={S.caption}>
              SICONFI · Bimestre 6 · Acumulado anual · EXCETO INTRA-ORÇAMENTÁRIAS (componente principal)
            </p>

            {orcamento ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <p style={S.label} className="mb-1">Dotação inicial</p>
                    <p className="font-light" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                      {formatPrecise(orcamento.dotacao_inicial)}
                    </p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Dotação atualizada</p>
                    <p className="font-light" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                      {formatPrecise(orcamento.dotacao_atualizada)}
                    </p>
                    {orcamento.dotacao_atualizada < orcamento.dotacao_inicial && (
                      <p style={{ fontSize: "11px", color: "var(--yellow-60, #b45309)" }}>
                        abaixo da dotação inicial — reduções orçamentárias ao longo do ano
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Empenhado (EXCETO INTRA)</p>
                    <p className="font-light" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                      {formatPrecise(orcamento.empenhado)}
                    </p>
                    {orcamento.intra_empenhado > 0 && (
                      <p style={S.caption}>
                        + INTRA: {formatPrecise(orcamento.intra_empenhado)} (auditoria)
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Liquidado (EXCETO INTRA)</p>
                    <p className="font-light" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                      {formatPrecise(orcamento.liquidado)}
                    </p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Taxa de execução</p>
                    <p className="font-light" style={{ fontSize: "22px", color: taxaColor }}>
                      {taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—"}
                    </p>
                    <p style={S.caption}>(Empenhado / Dotação atualizada)</p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">% do orçamento municipal</p>
                    <p className="font-light" style={{ fontSize: "22px", color: "var(--text-01)" }}>
                      {orcamento.pct_orcamento.toFixed(2)}%
                    </p>
                    <p style={S.caption}>
                      Total municipal empenhado: {formatPrecise(orcamento.total_municipal_empenhado)}
                    </p>
                  </div>
                </div>

                {/* Nota taxa alta */}
                {taxaExecucao !== null && taxaExecucao > 95 && (
                  <p className="mb-6" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
                    <strong style={{ color: "var(--text-03)" }}>Taxa {taxaExecucao.toFixed(1)}%:</strong> execução acima de 95% é o padrão
                    desta função em Sorocaba (2020 e 2022–2025). Indica que a dotação atualizada
                    é reajustada durante o ano via créditos adicionais para cobrir o subsídio ao
                    transporte — a dotação inicial é subestimada sistematicamente.
                  </p>
                )}

                <div style={S.info}>
                  <strong>Fonte:</strong>{" "}
                  <a href={orcamento.fonte_url} target="_blank" rel="noopener noreferrer"
                     style={{ color: "var(--blue-60)" }}>
                    SICONFI RREO Anexo 02 — Bimestre 6 — {year} ↗
                  </a>
                </div>
              </>
            ) : (
              <p style={S.body}>Dado RREO não disponível para {year}.</p>
            )}
          </div>
        </section>

        {/* ── DCA — Pago ────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <h2 style={S.h2} className="mb-2">Execução — DCA Anexo I-E</h2>
            <p className="mb-8" style={S.caption}>
              SICONFI · Total Geral da Despesa por Função 26 · Acumulado anual
            </p>

            {dca ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p style={S.label} className="mb-1">Empenhado</p>
                    <p className="font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                      {formatPrecise(dca.empenhado)}
                    </p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Liquidado</p>
                    <p className="font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                      {formatPrecise(dca.liquidado)}
                    </p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Pago</p>
                    <p className="font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                      {formatPrecise(dca.pago)}
                    </p>
                  </div>
                  <div>
                    <p style={S.label} className="mb-1">Restos a Pagar</p>
                    <p className="font-light" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                      {formatPrecise(dca.rp_nao_processado + dca.rp_processado)}
                    </p>
                    <p style={S.caption}>
                      NP: {formatPrecise(dca.rp_nao_processado)} · P: {formatPrecise(dca.rp_processado)}
                    </p>
                  </div>
                </div>
                <div style={S.info}>
                  <strong>Fonte:</strong>{" "}
                  <a href={dca.fonte_url} target="_blank" rel="noopener noreferrer"
                     style={{ color: "var(--blue-60)" }}>
                    SICONFI DCA Anexo I-E — {year} ↗
                  </a>
                </div>
              </>
            ) : (
              <p style={S.body}>Dado DCA não disponível para {year}.</p>
            )}
          </div>
        </section>

        {/* ── O que este dado não mostra ────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <h2 style={S.h2} className="mb-4">O que este relatório não mostra</h2>
            <ul style={{ ...S.body, listStyle: "disc", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Discriminação entre transporte público urbano e obras viárias (subfunção única)</li>
              <li>Dotação por subfunção — o RREO fornece apenas o total da função 26</li>
              <li>Operação (frota, linhas, passageiros) — URBES não publica dados abertos</li>
              <li>Contratos do serviço — PNCP disponível a partir de ~2022, requer curadoria</li>
              <li>Serviços intermunicipais (EMTU/SP) — fora do orçamento municipal</li>
            </ul>
          </div>
        </section>

        {/* ── Navegação entre anos ──────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderTop: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-6 flex justify-between items-center" style={S.container}>
            {hasPrev ? (
              <Link href={`/transporte/relatorio/${prevYear}`}
                    style={{ color: "var(--blue-60)", fontSize: "14px" }}>
                ← {prevYear}
              </Link>
            ) : <span />}
            <Link href="/transporte/comparativo"
                  style={{ color: "var(--text-03)", fontSize: "13px" }}>
              Ver comparativo histórico
            </Link>
            {hasNext ? (
              <Link href={`/transporte/relatorio/${nextYear}`}
                    style={{ color: "var(--blue-60)", fontSize: "14px" }}>
                {nextYear} →
              </Link>
            ) : <span />}
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
