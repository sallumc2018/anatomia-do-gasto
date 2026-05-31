import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { loadDcaSiconfi } from "@/lib/data"
import { DcaCharts } from "./DcaCharts"

export const metadata: Metadata = {
  title: "Controle Externo · TCE-SP e SICONFI",
  description:
    "Alertas do TCE-SP e declarações contábeis anuais (DCA/SICONFI) de Sorocaba, 2020–2025.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/controle-externo" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const CE_DIR = path.join(DATA_ROOT, "sorocaba", "controle_externo", "saida")

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
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  th: {
    fontSize: "11px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--text-04)",
    fontWeight: 600,
    padding: "10px 12px",
    textAlign: "left",
  } as React.CSSProperties,
  td: { fontSize: "13px", color: "var(--text-02)", padding: "10px 12px", textAlign: "left" } as React.CSSProperties,
}

function parseCsvLine(line: string): string[] {
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

interface AlertaSdg {
  comunicado: string
  ano: string
  bimestre: string
  processo: string
  responsavel: string
  incisos: string
  url: string
  observacao: string
}

function loadAlertasSdg(): AlertaSdg[] {
  const fp = path.join(CE_DIR, "alertas_sdg_2025_sorocaba.csv")
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, "utf-8").split("\n").filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const f = parseCsvLine(line)
    return {
      comunicado:  f[0]?.trim() ?? "",
      ano:         f[1]?.trim() ?? "",
      bimestre:    f[2]?.trim() ?? "",
      processo:    f[3]?.trim() ?? "",
      responsavel: f[5]?.trim() ?? "",
      incisos:     f[6]?.trim() ?? "",
      url:         f[7]?.trim() ?? "",
      observacao:  f[8]?.trim() ?? "",
    }
  }).filter((r) => r.comunicado)
}

const BIMESTRE_LABEL: Record<string, string> = {
  "1": "1º Bimestre", "2": "2º Bimestre", "3": "3º Bimestre",
  "4": "4º Bimestre", "5": "5º Bimestre", "6": "6º Bimestre",
}

export default function ControleExternoPage() {
  const alertas = loadAlertasSdg()

  // Load and aggregate DCA SICONFI Data
  const dcaRows = loadDcaSiconfi("sorocaba")
  const years = Array.from(new Set(dcaRows.map((r) => r.exercicio))).sort()
  const dcaAggregated = years.map((year) => {
    const yearRows = dcaRows.filter((r) => r.exercicio === year)
    const ativo = yearRows.find((r) => r.cod_conta === "P1.0.0.0.0.00.00")?.valor ?? 0
    const passivo = yearRows.find((r) => r.cod_conta === "P2.0.0.0.0.00.00")?.valor ?? 0
    const saldoPatrimonial = yearRows.find((r) => r.cod_conta === "SaldoPatrimonial")?.valor ?? 0
    return { year, ativo, passivo, saldoPatrimonial }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--theme-accent)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Controle Externo</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}
              >
                O que o SICONFI e o TCE-SP dizem sobre as contas de Sorocaba
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                Acompanhe o estado patrimonial consolidado enviado à União (SICONFI) e os alertas formais emitidos
                pelo Tribunal de Contas do Estado de São Paulo (TCE-SP). Os dados revelam as reais pressões fiscais
                do município.
              </p>
              <p style={S.caption}>
                Fontes: SICONFI/Tesouro Nacional (DCA 2020–2025) · TCE-SP (comunicados SDG)
              </p>
            </div>
          </div>
        </section>

        {/* Critical Fiscal Alert (ShieldAlert) */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <div
              className="p-6 rounded-lg border-2 border-amber-500 bg-amber-950/20 flex flex-col md:flex-row gap-6 items-start"
              style={{ borderLeftWidth: "8px" }}
            >
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-600 flex-shrink-0">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-amber-600 mb-2 uppercase tracking-wide">
                  Balanço patrimonial: patrimônio líquido negativo (2024–2025)
                </h2>
                <p style={{ ...S.body, fontSize: "14px", color: "var(--text-01)", marginBottom: "8px" }}>
                  A prestação de contas oficial enviada ao governo federal (SICONFI) registra patrimônio líquido negativo no
                  balanço de Sorocaba/SP a partir de 2024 — as obrigações de longo prazo provisionadas passaram a superar, no balanço, os bens e direitos do município:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  <div className="p-4 rounded border border-amber-500/30 bg-amber-950/30">
                    <p className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Exercício 2024</p>
                    <p className="text-2xl font-mono font-bold text-amber-600">-R$ 1,22 Bilhão</p>
                  </div>
                  <div className="p-4 rounded border border-amber-500/30 bg-amber-950/30">
                    <p className="text-xs uppercase tracking-wider text-amber-600 font-semibold">Exercício 2025</p>
                    <p className="text-2xl font-mono font-bold text-amber-600">-R$ 2,44 Bilhões</p>
                  </div>
                </div>
                <p style={{ ...S.caption, color: "var(--text-03)" }}>
                  Este resultado reflete o reconhecimento de obrigações de longo prazo (como passivos atuariais e empréstimos):
                  o Passivo Não Circulante mais que triplicou em 2024. É uma medida patrimonial de longo prazo — não, por si só,
                  um indicador de incapacidade de pagar despesas correntes no curto prazo. Os dados de 2025 podem ser preliminares até o fechamento do DCA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DCA SICONFI Charts & Data */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>Dados Contábeis Consolidados</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              Gráficos interativos elaborados a partir do processamento das Declarações das Contas Anuais (DCA) oficiais do município.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                <DcaCharts data={dcaAggregated} />
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-base)]">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-01)]">
                    Tabela de Balanço Patrimonial (R$ Reais)
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={S.borderBottom}>
                          <th style={{ ...S.th, padding: "8px 6px" }}>Ano</th>
                          <th style={{ ...S.th, padding: "8px 6px", textAlign: "right" }}>Ativo</th>
                          <th style={{ ...S.th, padding: "8px 6px", textAlign: "right" }}>Passivo + PL</th>
                          <th style={{ ...S.th, padding: "8px 6px", textAlign: "right" }}>Patrimônio Líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dcaAggregated.map((r) => (
                          <tr key={r.year} style={S.borderBottom}>
                            <td style={{ ...S.td, padding: "10px 6px", fontWeight: 600 }}>{r.year}</td>
                            <td style={{ ...S.td, padding: "10px 6px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)" }}>
                              {(r.ativo / 1e9).toFixed(2)}B
                            </td>
                            <td style={{ ...S.td, padding: "10px 6px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)" }}>
                              {(r.passivo / 1e9).toFixed(2)}B
                            </td>
                            <td style={{
                              ...S.td,
                              padding: "10px 6px",
                              textAlign: "right",
                              fontFamily: "var(--font-ibm-plex-mono)",
                              fontWeight: "bold",
                              color: r.saldoPatrimonial < 0 ? "rgb(239 68 68)" : "rgb(34 197 94)"
                            }}>
                              {(r.saldoPatrimonial / 1e9).toFixed(2)}B
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-base)]">
                  <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-[var(--text-01)]">
                    Metodologia de Análise
                  </h3>
                  <p style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>
                    Os valores são obtidos diretamente do Anexo I-AB da DCA de Sorocaba, extraindo os saldos em 31 de dezembro de cada exercício financeiro.
                    O saldo negativo recorrente a partir de 2024 evidencia uma vulnerabilidade estrutural profunda ligada ao endividamento e à previdência (IPESP).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alertas SDG */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>
              Alertas SDG · TCE-SP — {alertas.length} {alertas.length === 1 ? "alerta" : "alertas"} mapeados
            </p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              O SDG (Seção de Dados Gerenciais) do TCE-SP emite comunicados formais quando o município
              descumpre limites constitucionais ou da Lei de Responsabilidade Fiscal.
            </p>
            {alertas.length === 0 ? (
              <p style={{ ...S.body, color: "var(--text-04)" }}>Nenhum alerta mapeado no período.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                  <thead>
                    <tr style={S.borderBottom}>
                      <th style={S.th}>Comunicado</th>
                      <th style={S.th}>Período</th>
                      <th style={S.th}>Processo</th>
                      <th style={S.th}>Responsável</th>
                      <th style={S.th}>Incisos</th>
                      <th style={S.th}>Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertas.map((r, i) => (
                      <tr key={i} style={S.borderBottom}>
                        <td style={{ ...S.td, fontWeight: 600, color: "var(--text-01)", whiteSpace: "nowrap" }}>
                          {r.comunicado}
                        </td>
                        <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                          {BIMESTRE_LABEL[r.bimestre] ?? `${r.bimestre}º Bim`} · {r.ano}
                        </td>
                        <td style={{ ...S.td, fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}>
                          {r.processo}
                        </td>
                        <td style={S.td}>{r.responsavel}</td>
                        <td style={{ ...S.td, fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}>
                          {r.incisos}
                        </td>
                        <td style={S.td}>
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--blue-40)", textDecoration: "underline", fontSize: "12px" }}
                            >
                              PDF oficial
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sorocaba/saude-fiscal" className="nav-link">Saúde Fiscal</Link>
            <Link href="/sorocaba/dados" className="nav-link">Todos os dados</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
            <Link href="/contato" className="nav-link">Reportar erro</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
