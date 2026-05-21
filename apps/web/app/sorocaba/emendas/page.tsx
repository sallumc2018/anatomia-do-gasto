import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  loadEmendasPorParlamentar,
  loadEmendasPorAno,
  formatMillions,
  formatPrecise,
} from "@/lib/data"

export const metadata: Metadata = {
  title: "Vereadores e Emendas Impositivas",
  description:
    "Emendas impositivas de Sorocaba por vereador: quanto cada um indicou e quanto foi efetivamente pago. Fonte: CEPA. Cobertura efetiva a partir de 2022.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/emendas" },
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
  h2: { fontSize: "22px", lineHeight: "30px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body: { fontSize: "15px", lineHeight: "24px", color: "var(--text-02)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
  th: {
    fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase",
    color: "var(--text-04)", fontWeight: 600, padding: "10px 12px", textAlign: "right",
  } as React.CSSProperties,
  td: { fontSize: "14px", color: "var(--text-02)", padding: "10px 12px", textAlign: "right" } as React.CSSProperties,
}

function pct(num: number, den: number): string {
  if (den <= 0) return "—"
  return `${((num / den) * 100).toFixed(1)}%`
}

export default function EmendasPage() {
  const porParlamentar = loadEmendasPorParlamentar()
  const porAno = loadEmendasPorAno()

  const totalIndicado = porParlamentar.reduce((s, r) => s + r.valor, 0)
  const totalPago = porParlamentar.reduce((s, r) => s + r.pago, 0)
  const totalEmendas = porParlamentar.reduce((s, r) => s + r.qtd_emendas, 0)
  const numParlamentares = porParlamentar.length

  const cards = [
    { label: "Total indicado", valor: formatMillions(totalIndicado) },
    { label: "Total pago", valor: formatMillions(totalPago) },
    { label: "Taxa de pagamento", valor: pct(totalPago, totalIndicado) },
    { label: "Parlamentares", valor: String(numParlamentares) },
    { label: "Emendas", valor: totalEmendas.toLocaleString("pt-BR") },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Vereadores e Emendas</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}
              >
                Quanto cada vereador indicou em emendas — e quanto virou pagamento
              </h1>
              <p style={{ ...S.body, maxWidth: "660px", marginBottom: "20px" }}>
                A emenda impositiva é a parcela do orçamento que cada vereador pode direcionar a uma
                secretaria ou destino. Indicar não é pagar: aqui mostramos a cadeia completa —
                valor indicado, empenhado, liquidado e efetivamente pago.
              </p>
              <div
                className="p-4"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "660px" }}
              >
                <p style={{ ...S.caption, color: "var(--text-03)" }}>
                  <strong style={{ color: "var(--text-02)" }}>Fonte:</strong> CEPA — Controle de Emendas
                  Parlamentares (Agência de Notícias de Sorocaba).{" "}
                  <strong style={{ color: "var(--text-02)" }}>Período:</strong> 2020–2026.{" "}
                  A cobertura completa começa em 2022; 2020–2021 trazem apenas emendas federais de
                  transferência especial registradas no sistema. Dado ausente não é tratado como zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div
              className="grid grid-cols-2 md:grid-cols-5"
              style={{ borderTop: "1px solid var(--border-01)", borderLeft: "1px solid var(--border-01)" }}
            >
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="p-6"
                  style={{ borderRight: "1px solid var(--border-01)", borderBottom: "1px solid var(--border-01)" }}
                >
                  <p style={{ ...S.label, marginBottom: "8px" }}>{c.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: 300, color: "var(--text-01)" }}>{c.valor}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por ano */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>Emendas por ano de exercício</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              Evolução anual do valor indicado e do que foi efetivamente pago.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                <thead>
                  <tr style={S.borderBottom}>
                    <th style={{ ...S.th, textAlign: "left" }}>Ano</th>
                    <th style={S.th}>Emendas</th>
                    <th style={S.th}>Indicado</th>
                    <th style={S.th}>Empenhado</th>
                    <th style={S.th}>Liquidado</th>
                    <th style={S.th}>Pago</th>
                    <th style={S.th}>% pago</th>
                  </tr>
                </thead>
                <tbody>
                  {porAno.map((r) => (
                    <tr key={r.ano} style={S.borderBottom}>
                      <td style={{ ...S.td, textAlign: "left", color: "var(--text-01)", fontWeight: 500 }}>{r.ano}</td>
                      <td style={S.td}>{r.qtd_emendas.toLocaleString("pt-BR")}</td>
                      <td style={S.td}>{formatMillions(r.valor)}</td>
                      <td style={S.td}>{formatMillions(r.empenhado)}</td>
                      <td style={S.td}>{formatMillions(r.liquidado)}</td>
                      <td style={S.td}>{formatMillions(r.pago)}</td>
                      <td style={{ ...S.td, color: "var(--text-01)" }}>{pct(r.pago, r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Ranking por parlamentar */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>Ranking por parlamentar</p>
            <p style={{ ...S.body, maxWidth: "640px", marginBottom: "24px" }}>
              Ordenado pelo valor total indicado no período. O percentual mostra quanto do indicado
              chegou a pagamento — indicar não garante execução.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                <thead>
                  <tr style={S.borderBottom}>
                    <th style={{ ...S.th, textAlign: "left" }}>#</th>
                    <th style={{ ...S.th, textAlign: "left" }}>Parlamentar</th>
                    <th style={S.th}>Emendas</th>
                    <th style={S.th}>Indicado</th>
                    <th style={S.th}>Pago</th>
                    <th style={S.th}>% pago</th>
                  </tr>
                </thead>
                <tbody>
                  {porParlamentar.map((r, i) => (
                    <tr key={r.nome_parlamentar} style={S.borderBottom}>
                      <td style={{ ...S.td, textAlign: "left", color: "var(--text-04)", fontFamily: "monospace" }}>
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td style={{ ...S.td, textAlign: "left", color: "var(--text-01)" }}>{r.nome_parlamentar}</td>
                      <td style={S.td}>{r.qtd_emendas.toLocaleString("pt-BR")}</td>
                      <td style={S.td} title={formatPrecise(r.valor)}>{formatMillions(r.valor)}</td>
                      <td style={S.td} title={formatPrecise(r.pago)}>{formatMillions(r.pago)}</td>
                      <td style={{ ...S.td, color: "var(--text-01)" }}>{pct(r.pago, r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Nota / CTA */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>Limitações</p>
                <p style={{ ...S.body, maxWidth: "620px" }}>
                  Os valores refletem o que o sistema CEPA expõe publicamente. A atribuição
                  parlamentar → destino → execução vem da própria base oficial; divergências com
                  empenho contábil são possíveis e estão sob conferência cruzada.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 flex-shrink-0">
                <Link href="/sorocaba/lacunas" className="nav-link">Lacunas conhecidas</Link>
                <Link href="/metodologia" className="nav-link">Ver metodologia</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
