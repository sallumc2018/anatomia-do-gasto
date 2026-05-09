import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsTransporte,
  loadTransporteOrcamento,
  loadTransporteDca,
} from "@/lib/data"

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
  th: {
    padding: "8px 12px",
    textAlign: "right" as const,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "var(--text-03)",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid var(--border-01)",
    whiteSpace: "nowrap" as const,
  },
  thLeft: {
    padding: "8px 12px",
    textAlign: "left" as const,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    color: "var(--text-03)",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid var(--border-01)",
  },
  td: {
    padding: "10px 12px",
    textAlign: "right" as const,
    fontSize: "13px",
    color: "var(--text-02)",
    borderBottom: "1px solid var(--border-subtle, #f0f0f0)",
    fontVariantNumeric: "tabular-nums" as const,
  },
  tdLeft: {
    padding: "10px 12px",
    textAlign: "left" as const,
    fontSize: "13px",
    color: "var(--text-02)",
    borderBottom: "1px solid var(--border-subtle, #f0f0f0)",
  },
}

interface YearRow {
  year: number
  dotacao_inicial: number
  dotacao_atualizada: number
  empenhado: number
  pago: number | null
  taxa_execucao: number | null
  pct_orcamento: number
  variacao_pago: number | null
  fonte_url: string
}

function fmtMi(v: number) {
  return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
}

function taxaColor(taxa: number | null): string {
  if (taxa === null) return "var(--text-03)"
  if (taxa >= 85) return "var(--green-60, #16a34a)"
  if (taxa < 70)  return "var(--red-60, #dc2626)"
  return "var(--yellow-60, #b45309)"
}

export default function TransporteComparativoPage() {
  const years = getAvailableYearsTransporte()
  const chronological = [...years].reverse()

  const rows: YearRow[] = chronological.map((year, idx) => {
    const orc = loadTransporteOrcamento(year)
    const dca = loadTransporteDca(year)
    const pago = dca?.pago ?? null
    const taxa = orc && orc.dotacao_atualizada > 0
      ? (orc.empenhado / orc.dotacao_atualizada) * 100
      : null

    const prevPago = idx > 0 ? loadTransporteDca(chronological[idx - 1])?.pago ?? null : null
    const variacao = pago !== null && prevPago !== null && prevPago > 0
      ? ((pago - prevPago) / prevPago) * 100
      : null

    return {
      year,
      dotacao_inicial:    orc?.dotacao_inicial ?? 0,
      dotacao_atualizada: orc?.dotacao_atualizada ?? 0,
      empenhado:          orc?.empenhado ?? 0,
      pago,
      taxa_execucao:      taxa,
      pct_orcamento:      orc?.pct_orcamento ?? 0,
      variacao_pago:      variacao,
      fonte_url:          orc?.fonte_url ?? "",
    }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <nav style={S.caption} className="mb-4">
              <Link href="/transporte" style={{ color: "var(--blue-60)" }}>Transporte</Link>
              {" › "}
              <span>Comparativo histórico</span>
            </nav>
            <h1 className="font-light mb-3" style={{ fontSize: "32px", color: "var(--text-01)" }}>
              Comparativo histórico — Transporte
            </h1>
            <p style={S.body}>
              Função 26 (SICONFI) · Sorocaba/SP · RREO Anexo 02 + DCA Anexo I-E
            </p>

            <p className="mt-4" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
              <strong style={{ color: "var(--text-03)" }}>Lembre-se:</strong> os valores incluem transporte público urbano (ônibus/URBES)
              e obras viárias — não é possível separar as duas categorias com esta fonte.
            </p>
          </div>
        </section>

        {/* ── Tabela comparativa ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <h2 style={S.h2} className="mb-6">Série histórica 2020–2025</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <th style={S.thLeft}>Ano</th>
                    <th style={S.th}>Dot. Inicial</th>
                    <th style={S.th}>Dot. Atualizada</th>
                    <th style={S.th}>Empenhado</th>
                    <th style={S.th}>Pago (DCA)</th>
                    <th style={S.th}>Taxa exec.</th>
                    <th style={S.th}>Variação pago</th>
                    <th style={S.th}>% Mun.</th>
                    <th style={S.th}>Relatório</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.year}>
                      <td style={{ ...S.tdLeft, fontWeight: 500, color: "var(--text-01)" }}>
                        {row.year}
                      </td>
                      <td style={S.td}>{fmtMi(row.dotacao_inicial)}</td>
                      <td style={S.td}>{fmtMi(row.dotacao_atualizada)}</td>
                      <td style={S.td}>{fmtMi(row.empenhado)}</td>
                      <td style={S.td}>{row.pago !== null ? fmtMi(row.pago) : "—"}</td>
                      <td style={{ ...S.td, color: taxaColor(row.taxa_execucao), fontWeight: 500 }}>
                        {row.taxa_execucao !== null ? `${row.taxa_execucao.toFixed(1)}%` : "—"}
                      </td>
                      <td style={{
                        ...S.td,
                        color: row.variacao_pago === null
                          ? "var(--text-04)"
                          : row.variacao_pago > 0
                          ? "var(--green-60, #16a34a)"
                          : "var(--red-60, #dc2626)",
                      }}>
                        {row.variacao_pago !== null
                          ? `${row.variacao_pago > 0 ? "+" : ""}${row.variacao_pago.toFixed(1)}%`
                          : "—"}
                      </td>
                      <td style={S.td}>{row.pct_orcamento.toFixed(2)}%</td>
                      <td style={S.td}>
                        <Link href={`/transporte/relatorio/${row.year}`}
                              style={{ color: "var(--blue-60)", fontSize: "12px" }}>
                          ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4" style={S.caption}>
              Taxa exec. = Empenhado (EXCETO INTRA) / Dotação Atualizada.
              Verde ≥ 85% · Amarelo 70–85% · Vermelho &lt; 70%.
              Acima de 95% = padrão desta função em Sorocaba (dotação reajustada ao longo do ano).
            </p>
          </div>
        </section>

        {/* ── Notas metodológicas ───────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <h2 style={S.h2} className="mb-4">Notas metodológicas</h2>
            <ul style={{ ...S.body, listStyle: "disc", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong>Taxa de execução sistematicamente &gt;95%:</strong> padrão indica
                que a dotação inicial é subestimada e reforçada via créditos adicionais ao longo do ano.
                Não equivale a &ldquo;eficiência&rdquo; — o orçamento acompanha a despesa, não o contrário.
              </li>
              <li>
                <strong>2020 — subfunção dupla:</strong> em 2020 e 2021 Sorocaba declarou a Função 26
                em duas subfunções separadas no RREO — &ldquo;Transportes Coletivos Urbanos&rdquo; (subfunção 782)
                e &ldquo;FU26 - Demais Subfunções&rdquo;. A partir de 2022 tudo foi consolidado em subfunção única.
                Os valores desta tabela somam ambas as subfunções.
              </li>
              <li>
                <strong>2023 — dotação atualizada abaixo da inicial:</strong> R$&nbsp;457M vs
                R$&nbsp;500M inicial, indicando reduções orçamentárias ao longo do exercício.
              </li>
              <li>
                <strong>DCA Empenhado = RREO EXCETO INTRA</strong> em todos os anos verificados.
              </li>
              <li>
                <strong>Função 26 — subfunção única (2022–2025):</strong> análise por tipo de despesa
                (ônibus vs obras) é inviável com esta fonte — requer dados complementares da URBES
                ou portal de transparência municipal.
              </li>
            </ul>

            <div className="mt-8 flex gap-4 flex-wrap">
              <a
                href="https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--blue-60)", fontSize: "13px" }}
              >
                Fonte RREO: SICONFI/Tesouro Nacional ↗
              </a>
              <a
                href="https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--blue-60)", fontSize: "13px" }}
              >
                Fonte DCA: SICONFI/Tesouro Nacional ↗
              </a>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
