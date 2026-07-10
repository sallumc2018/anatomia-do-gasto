import type { Metadata } from "next"
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

const MUNICIPIO = "sao_bernardo"

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
  dcaEmpenhado: number | null
  rreoEmpenhado: number | null
  inconsistente: boolean
}

function fmtMi(v: number) {
  return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`
}

function taxaColor(taxa: number | null): string {
  if (taxa === null) return "var(--text-03)"
  if (taxa >= 85) return "var(--green-60, #16a34a)"
  if (taxa < 70) return "var(--red-60, #dc2626)"
  return "var(--yellow-60, #b45309)"
}

export const metadata: Metadata = {
  title: "Transporte em São Bernardo do Campo — série histórica",
  description:
    "Série histórica das despesas em transporte de São Bernardo do Campo: evolução anual de dotação, empenho, liquidação e pagamento. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 e DCA Anexo I-E.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-bernardo/transporte/comparativo" },
}

export default function TransporteComparativoPage() {
  const years = getAvailableYearsTransporte(MUNICIPIO)
  const chronological = [...years].reverse()

  const rows: YearRow[] = chronological.map((year, idx) => {
    const orc = loadTransporteOrcamento(year, MUNICIPIO)
    const dca = loadTransporteDca(year, MUNICIPIO)
    const pago = dca?.pago ?? null
    const taxa = orc && orc.dotacao_atualizada > 0
      ? (orc.empenhado / orc.dotacao_atualizada) * 100
      : null

    const prevPago = idx > 0 ? loadTransporteDca(chronological[idx - 1], MUNICIPIO)?.pago ?? null : null
    const variacao = pago !== null && prevPago !== null && prevPago > 0
      ? ((pago - prevPago) / prevPago) * 100
      : null

    const dcaEmpenhado = dca?.empenhado ?? null
    const rreoEmpenhado = orc?.empenhado ?? null
    // DCA Empenhado deveria ser igual ao RREO Empenhado (EXCETO INTRA). Tolerância de
    // R$ 1 para diferenças de arredondamento de centavos entre as duas fontes SICONFI.
    const inconsistente = dcaEmpenhado !== null && rreoEmpenhado !== null
      && Math.abs(dcaEmpenhado - rreoEmpenhado) > 1

    return {
      year,
      dotacao_inicial: orc?.dotacao_inicial ?? 0,
      dotacao_atualizada: orc?.dotacao_atualizada ?? 0,
      empenhado: orc?.empenhado ?? 0,
      pago,
      taxa_execucao: taxa,
      pct_orcamento: orc?.pct_orcamento ?? 0,
      variacao_pago: variacao,
      fonte_url: orc?.fonte_url ?? "",
      dcaEmpenhado,
      rreoEmpenhado,
      inconsistente,
    }
  })

  const yearRange = years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}` : years.length === 1 ? String(years[0]) : "—"
  const anosInconsistentes = rows.filter((r) => r.inconsistente)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <nav style={S.caption} className="mb-4">
              <Link href="/sao-bernardo/transporte" style={{ color: "var(--blue-60)" }}>Transporte</Link>
              {" › "}
              <span>Comparativo histórico</span>
            </nav>
            <h1 className="font-light mb-3" style={{ fontSize: "32px", color: "var(--text-01)" }}>
              Comparativo histórico — Transporte
            </h1>
            <p style={S.body}>
              Função 26 (SICONFI) · São Bernardo do Campo/SP · RREO Anexo 02 + DCA Anexo I-E
            </p>

            <p className="mt-4" style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
              <strong style={{ color: "var(--text-03)" }}>Lembre-se:</strong> a função 26 agrupa todas as
              subfunções de transporte declaradas por São Bernardo do Campo (transporte coletivo urbano,
              obras viárias e demais) em um único total — não é possível separar categorias com esta fonte.
            </p>
          </div>
        </section>

        {/* ── Tabela comparativa ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <h2 style={S.h2} className="mb-6">Série histórica {yearRange}</h2>
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
                        {row.inconsistente && (
                          <sup style={{ color: "var(--yellow-60, #b45309)", marginLeft: "4px" }} title="Inconsistência DCA vs RREO — ver notas metodológicas">⚠</sup>
                        )}
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
                        <Link href={`/sao-bernardo/transporte/relatorio/${row.year}`}
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
              {anosInconsistentes.length > 0 && " ⚠ = Empenhado do DCA diverge do Empenhado do RREO no mesmo ano (ver notas abaixo)."}
            </p>
          </div>
        </section>

        {/* ── Notas metodológicas ───────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <h2 style={S.h2} className="mb-4">Notas metodológicas</h2>
            <ul style={{ ...S.body, listStyle: "disc", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {anosInconsistentes.length > 0 && (
                <li>
                  <strong>{anosInconsistentes.map((r) => r.year).join(" e ")} — pequena divergência entre DCA e RREO:</strong>{" "}
                  {anosInconsistentes.map((r, i) => (
                    <span key={r.year}>
                      {i > 0 && "; "}
                      em {r.year}, o Empenhado do DCA Anexo I-E ({r.dcaEmpenhado !== null ? fmtMi(r.dcaEmpenhado) : "—"}
                      {" "}/ {r.dcaEmpenhado !== null ? r.dcaEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"})
                      difere do Empenhado do RREO Anexo 02 ({r.rreoEmpenhado !== null ? r.rreoEmpenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"})
                      em cerca de{" "}
                      {r.dcaEmpenhado !== null && r.rreoEmpenhado !== null
                        ? Math.abs(r.dcaEmpenhado - r.rreoEmpenhado).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </span>
                  ))}
                  . A diferença é pequena (bem abaixo de 0,01% do valor total) e não muda a leitura de magnitude do gasto,
                  mas é uma divergência real entre os dois anexos declarados ao SICONFI para o mesmo exercício — a
                  tabela usa a fonte de cada indicador (RREO para dotação/empenhado, DCA para pago) sem corrigir a
                  inconsistência, que é do dado declarado, não de processamento local.
                </li>
              )}
              <li>
                <strong>Função 26 — subfunção única:</strong> a fonte não permite separar transporte
                coletivo urbano de obras viárias e demais subfunções de mobilidade.
              </li>
              <li>
                <strong>Série 2015–2025:</strong> cobertura contínua para os dois anexos SICONFI (RREO Anexo 02
                e DCA Anexo I-E) nesse período, sem lacunas conhecidas.
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
