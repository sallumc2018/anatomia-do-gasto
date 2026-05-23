import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Controle Externo · TCE-SP e SICONFI",
  description:
    "Alertas do TCE-SP e declarações contábeis anuais (DCA/SICONFI) de Sorocaba, 2020–2025.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/controle-externo" },
}

const DATA_ROOT = path.join(process.cwd(), "..", "..", "data", "public")
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

interface DcaYear { exercicio: number; count: number }

function loadDcaCoverage(): DcaYear[] {
  const fp = path.join(CE_DIR, "dca_siconfi_sorocaba_2020_2025.csv")
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, "utf-8").split("\n")
  const byYear: Record<number, number> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c1 = line.indexOf(",")
    if (c1 === -1) continue
    const yr = parseInt(line.slice(0, c1))
    if (!isNaN(yr) && yr >= 2015 && yr <= 2030) byYear[yr] = (byYear[yr] ?? 0) + 1
  }
  return Object.entries(byYear)
    .map(([yr, count]) => ({ exercicio: parseInt(yr), count }))
    .sort((a, b) => a.exercicio - b.exercicio)
}

const BIMESTRE_LABEL: Record<string, string> = {
  "1": "1º Bimestre", "2": "2º Bimestre", "3": "3º Bimestre",
  "4": "4º Bimestre", "5": "5º Bimestre", "6": "6º Bimestre",
}

export default function ControleExternoPage() {
  const alertas = loadAlertasSdg()
  const dca     = loadDcaCoverage()
  const totalDca = dca.reduce((s, r) => s + r.count, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Controle Externo</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}
              >
                O que o TCE-SP e o SICONFI dizem sobre as contas de Sorocaba
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                O Tribunal de Contas do Estado de SP fiscaliza a gestão municipal e emite alertas quando
                identifica irregularidades ou descumprimento de limites legais. Esta página reúne os
                alertas formais (SDG) dirigidos à Prefeitura de Sorocaba e a cobertura das Declarações
                das Contas Anuais (DCA) enviadas ao SICONFI — base federal de prestação de contas.
              </p>
              <p style={S.caption}>
                Fontes: TCE-SP (comunicados SDG) · SICONFI/Tesouro Nacional (DCA 2020–2025)
              </p>
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
              descumpre limites constitucionais — gastos com pessoal, saúde, educação, dívida.
              O comunicado nomeia o responsável e indica os incisos infringidos.
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
            {alertas.some((a) => a.observacao) && (
              <div className="mt-4">
                {alertas.filter((a) => a.observacao).map((a, i) => (
                  <p key={i} style={{ ...S.caption, marginTop: "4px" }}>
                    <strong style={{ color: "var(--text-03)" }}>{a.comunicado}:</strong> {a.observacao}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* DCA SICONFI */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>DCA SICONFI · Declaração das Contas Anuais</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              A DCA é a prestação de contas anual que cada município envia ao Tesouro Nacional via
              SICONFI. Inclui balanço patrimonial, demonstração das variações patrimoniais e outros
              anexos contábeis. A cobertura abaixo indica os exercícios disponíveis na base local.
            </p>
            {dca.length === 0 ? (
              <p style={{ ...S.body, color: "var(--text-04)" }}>Dados DCA não encontrados.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <div style={S.borderTop}>
                    {dca.map((r) => (
                      <div key={r.exercicio} className="flex items-center justify-between py-4" style={S.borderBottom}>
                        <span className="font-mono font-semibold" style={{ fontSize: "15px", color: "var(--text-01)" }}>
                          {r.exercicio}
                        </span>
                        <span style={{ ...S.caption, color: "var(--text-03)" }}>
                          {r.count.toLocaleString("pt-BR")} registros contábeis
                        </span>
                      </div>
                    ))}
                    <p className="pt-4" style={S.caption}>
                      Total: {totalDca.toLocaleString("pt-BR")} registros · {dca.length} exercícios
                    </p>
                  </div>
                </div>
                <div>
                  <div
                    className="p-6"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}
                  >
                    <p className="uppercase font-semibold mb-3" style={S.label}>O que é a DCA</p>
                    <ul className="flex flex-col gap-2">
                      {[
                        "Balanço Patrimonial (Ativo, Passivo, PL)",
                        "Demonstração das Variações Patrimoniais (DVP)",
                        "Demonstração dos Fluxos de Caixa (DFC)",
                        "Notas Explicativas e Anexos LRF",
                        "Comparação com exercício anterior — mesmos anexos",
                      ].map((item) => (
                        <li key={item} className="flex gap-3 items-start">
                          <span style={{ color: "var(--text-04)", flexShrink: 0, marginTop: "2px" }}>—</span>
                          <p style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>{item}</p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4" style={S.caption}>
                      Fonte oficial: SICONFI — Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro
                    </p>
                  </div>
                </div>
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
