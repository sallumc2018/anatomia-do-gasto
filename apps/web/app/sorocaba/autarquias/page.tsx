import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { formatMillions } from "@/lib/data"

export const metadata: Metadata = {
  title: "Autarquias e Empresas Municipais · Sorocaba",
  description:
    "SAAE, Funserv e empresas municipais de Sorocaba: despesas e receitas 2020–2025. Fonte: TCE-SP.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/autarquias" },
}

const DATA_ROOT = path.join(process.cwd(), "..", "..", "data", "public")
const AUTARQUIAS = path.join(DATA_ROOT, "sorocaba", "autarquias", "saida")

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
  th: {
    fontSize: "11px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--text-04)",
    fontWeight: 600,
    padding: "10px 12px",
    textAlign: "right",
  } as React.CSSProperties,
  td: { fontSize: "14px", color: "var(--text-02)", padding: "10px 12px", textAlign: "right" } as React.CSSProperties,
}

function parseBrFloat(s: string): number {
  return parseFloat(s.replace(/"/g, "").trim().replace(/\./g, "").replace(",", ".")) || 0
}

interface AnoTotal { ano: number; total: number; count: number }

function aggregateTransacoes(filename: string): AnoTotal[] {
  const fp = path.join(AUTARQUIAS, filename)
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, "utf-8").split("\n")
  const byAno: Record<number, AnoTotal> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const c1 = line.indexOf(",")
    if (c1 === -1) continue
    const ano = parseInt(line.slice(0, c1))
    if (isNaN(ano) || ano < 2015 || ano > 2030) continue
    const vlStart = line.endsWith('"') ? line.lastIndexOf(',"') : line.lastIndexOf(",")
    const vl = parseBrFloat(line.slice(vlStart + 1))
    if (!byAno[ano]) byAno[ano] = { ano, total: 0, count: 0 }
    byAno[ano].total += vl
    byAno[ano].count++
  }
  return Object.values(byAno).sort((a, b) => a.ano - b.ano)
}

interface RppsRow { ano: number; receitas: number; despesas: number; resultado: number }

function loadRpps(): RppsRow[] {
  const fp = path.join(AUTARQUIAS, "funserv_rpps_sorocaba.csv")
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, "utf-8").split("\n")
  const rows: RppsRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(",")
    if (parts.length < 7) continue
    const ano = parseInt(parts[0])
    if (isNaN(ano)) continue
    rows.push({
      ano,
      receitas: parseFloat(parts[3]) || 0,
      despesas: parseFloat(parts[5]) || 0,
      resultado: parseFloat(parts[6]) || 0,
    })
  }
  return rows
}

function AnoTable({ rows, valueLabel }: { rows: AnoTotal[]; valueLabel: string }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={S.borderBottom}>
            <th style={{ ...S.th, textAlign: "left" }}>Ano</th>
            <th style={S.th}>Registros</th>
            <th style={S.th}>{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ano} style={S.borderBottom}>
              <td style={{ ...S.td, textAlign: "left", fontWeight: 500, color: "var(--text-01)" }}>{r.ano}</td>
              <td style={S.td}>{r.count.toLocaleString("pt-BR")}</td>
              <td style={S.td}>{formatMillions(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AutarquiasPage() {
  const saaeDesp     = aggregateTransacoes("saae_despesas_tce_2020_2026.csv")
  const saaeRec      = aggregateTransacoes("saae_receitas_tce_2020_2026.csv")
  const funservDesp  = aggregateTransacoes("funserv_saude_tce_2020_2025.csv")
  const empresasDesp = aggregateTransacoes("empresas_municipais_tce_2020_2025.csv")
  const rpps         = loadRpps()

  const totalSaaeDesp    = saaeDesp.reduce((s, r) => s + r.total, 0)
  const totalSaaeRec     = saaeRec.reduce((s, r) => s + r.total, 0)
  const totalFunserv     = funservDesp.reduce((s, r) => s + r.total, 0)
  const totalEmpresas    = empresasDesp.reduce((s, r) => s + r.total, 0)
  const totalRegistros   = [saaeDesp, saaeRec, funservDesp, empresasDesp]
    .flat().reduce((s, r) => s + r.count, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Autarquias e Empresas Municipais</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}
              >
                SAAE, Funserv e empresas ligadas à Prefeitura — o que cada uma gasta
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                A Prefeitura de Sorocaba controla autarquias e empresas públicas que executam serviços
                essenciais: saneamento básico (SAAE), saúde dos servidores (Funserv) e desenvolvimento
                urbano e social. Os dados cobrem despesas e receitas de 2020 a 2025 extraídos das
                declarações enviadas ao TCE-SP.
              </p>
              <div
                className="p-4"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}
              >
                <p style={S.caption}>
                  <strong style={{ color: "var(--text-02)" }}>Fonte:</strong> TCE-SP — execução orçamentária
                  declarada pelas entidades.{" "}
                  <strong style={{ color: "var(--text-02)" }}>Período:</strong> 2020–2025.{" "}
                  <strong style={{ color: "var(--text-02)" }}>Total de registros:</strong>{" "}
                  {totalRegistros.toLocaleString("pt-BR")}. Dado ausente não é zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards de resumo */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ borderTop: "1px solid var(--border-01)", borderLeft: "1px solid var(--border-01)" }}
            >
              {[
                { label: "SAAE · despesas 2020–2025",       valor: formatMillions(totalSaaeDesp),  nota: `${saaeDesp.reduce((s, r) => s + r.count, 0).toLocaleString("pt-BR")} registros` },
                { label: "SAAE · receitas 2020–2025",       valor: formatMillions(totalSaaeRec),   nota: `${saaeRec.reduce((s, r) => s + r.count, 0).toLocaleString("pt-BR")} registros` },
                { label: "Funserv Saúde · despesas",        valor: formatMillions(totalFunserv),   nota: `${funservDesp.reduce((s, r) => s + r.count, 0).toLocaleString("pt-BR")} registros` },
                { label: "Empresas municipais · despesas",  valor: formatMillions(totalEmpresas),  nota: `${empresasDesp.reduce((s, r) => s + r.count, 0).toLocaleString("pt-BR")} registros` },
              ].map((c) => (
                <div
                  key={c.label}
                  className="p-6"
                  style={{ borderRight: "1px solid var(--border-01)", borderBottom: "1px solid var(--border-01)" }}
                >
                  <p style={{ ...S.label, marginBottom: "8px" }}>{c.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: 300, color: "var(--text-01)", marginBottom: "4px" }}>{c.valor}</p>
                  <p style={S.caption}>{c.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAAE */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>SAAE · Serviço Autônomo de Água e Esgoto</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              Autarquia municipal responsável pelo abastecimento de água e esgotamento sanitário.
              Dados de despesas e receitas declarados ao TCE-SP, 2020–2025.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <p className="font-semibold mb-4" style={{ fontSize: "13px", color: "var(--text-02)" }}>Despesas por ano</p>
                <AnoTable rows={saaeDesp} valueLabel="Total despesas" />
              </div>
              <div>
                <p className="font-semibold mb-4" style={{ fontSize: "13px", color: "var(--text-02)" }}>Receitas por ano</p>
                <AnoTable rows={saaeRec} valueLabel="Total arrecadado" />
              </div>
            </div>
          </div>
        </section>

        {/* Funserv */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>Funserv · Fundo de Assistência à Saúde dos Servidores</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              O Funserv cobre plano de saúde e previdência complementar dos servidores municipais.
              A tabela de saúde mostra despesas declaradas ao TCE-SP; a tabela RPPS mostra o resultado
              previdenciário anual (SICONFI/RREO).
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <p className="font-semibold mb-4" style={{ fontSize: "13px", color: "var(--text-02)" }}>Saúde · despesas por ano</p>
                <AnoTable rows={funservDesp} valueLabel="Total" />
              </div>
              {rpps.length > 0 && (
                <div>
                  <p className="font-semibold mb-4" style={{ fontSize: "13px", color: "var(--text-02)" }}>RPPS · resultado previdenciário</p>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={S.borderBottom}>
                          <th style={{ ...S.th, textAlign: "left" }}>Ano</th>
                          <th style={S.th}>Receitas</th>
                          <th style={S.th}>Despesas</th>
                          <th style={S.th}>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpps.map((r) => (
                          <tr key={r.ano} style={S.borderBottom}>
                            <td style={{ ...S.td, textAlign: "left", fontWeight: 500, color: "var(--text-01)" }}>{r.ano}</td>
                            <td style={S.td}>{formatMillions(r.receitas)}</td>
                            <td style={S.td}>{formatMillions(r.despesas)}</td>
                            <td style={{ ...S.td, color: r.resultado > 0 ? "var(--text-01)" : "var(--text-03)" }}>
                              {formatMillions(r.resultado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3" style={S.caption}>
                    Receitas incluem contribuições de segurados, patronal e demais ingressos.
                    Fonte: SICONFI/RREO Anexo — 6º bimestre de cada exercício.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Empresas municipais */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>Empresas Municipais</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              Empresas públicas e de economia mista ligadas à Prefeitura — incluindo a Empresa de
              Desenvolvimento Urbano e Social de Sorocaba. Despesas declaradas ao TCE-SP, 2020–2025.
            </p>
            <div style={{ maxWidth: "560px" }}>
              <AnoTable rows={empresasDesp} valueLabel="Total despesas" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sorocaba/dados" className="nav-link">Todos os dados</Link>
            <Link href="/sorocaba/lacunas" className="nav-link">Lacunas conhecidas</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
            <Link href="/contato" className="nav-link">Reportar erro</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
