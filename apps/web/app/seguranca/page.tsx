import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsSeguranca,
  loadSegurancaData,
  SUBFUNCAO_LABELS,
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
  small: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const SEGURANCA_TOTAL = "06 - Segurança Pública"

export default function SegurancaPage() {
  const years = getAvailableYearsSeguranca()
  const latestYear = years[0]
  const latestRows = latestYear ? loadSegurancaData(latestYear) : []
  const total = latestRows.find((row) => row.subfuncao === SEGURANCA_TOTAL) ?? latestRows[0]
  const subfuncoes = latestRows.filter((row) => row.subfuncao !== SEGURANCA_TOTAL)
  const firstSource = latestRows.find((row) => row.fonte_url)?.fonte_url

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Segurança Pública em Sorocaba
              </h1>
              <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "700px" }}>
                Acompanhe a despesa anual em segurança pública por subfunção, com base no DCA Anexo I-E do SICONFI.
                Esta fonte não é a mesma família de documentos municipais usada em saúde e educação.
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--text-03)", letterSpacing: "0.04em" }}>
                Piloto · Sorocaba/SP · Segurança Pública · {years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—"}
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
              <div>
                <p style={S.label}>Panorama atual</p>
                <h2 className="font-light mt-3 mb-5" style={S.h2}>
                  {total ? formatMillions(total.liquidada) : "sem dado"}
                </h2>
                <p style={{ ...S.body, maxWidth: "620px" }}>
                  Valor liquidado em segurança pública no último ano disponível ({latestYear ?? "-"}), incluindo a função total e as subfunções publicadas pelo SICONFI.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <p style={S.small}>Empenhado: {total ? formatPrecise(total.empenhada) : "sem dado"}</p>
                  <p style={S.small}>Liquidado: {total ? formatPrecise(total.liquidada) : "sem dado"}</p>
                  <p style={S.small}>Pago: {total ? formatPrecise(total.paga) : "sem dado"}</p>
                </div>
              </div>

              <div>
                <div style={S.borderTop}>
                  {subfuncoes.map((row) => (
                    <div
                      key={row.subfuncao}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 py-4"
                      style={S.borderBottom}
                    >
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-01)", fontSize: "15px" }}>
                          {SUBFUNCAO_LABELS[row.subfuncao] ?? row.subfuncao}
                        </p>
                        <p style={S.small}>{row.subfuncao}</p>
                      </div>
                      <p style={{ ...S.body, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                        {formatMillions(row.liquidada)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderTop, ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {[
                ["Fonte oficial", "SICONFI — DCA Anexo I-E, com snapshot bruto preservado localmente antes da publicação em CSV."],
                ["O que mostra", "Despesa anual por função e subfunção, com valores empenhados, liquidados, pagos e restos a pagar."],
                ["O que não mostra", "Fornecedor, unidade, contrato, nota fiscal, ocorrência policial, efetivo ou localização operacional detalhada."],
              ].map(([title, text], i) => (
                <div
                  key={title}
                  className="py-8"
                  style={{
                    paddingRight: i < 2 ? "32px" : 0,
                    paddingLeft: i > 0 ? "32px" : 0,
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                  }}
                >
                  <p style={{ ...S.label, marginBottom: "10px" }}>{title}</p>
                  <p style={S.body}>{text}</p>
                </div>
              ))}
            </div>

            {firstSource && (
              <div className="mt-8">
                <p style={{ ...S.label, marginBottom: "10px" }}>URL oficial declarada no dataset</p>
                <a href={firstSource} target="_blank" rel="noopener noreferrer" style={{ ...S.body, color: "var(--text-01)", textDecoration: "underline" }}>
                  {firstSource}
                </a>
              </div>
            )}
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-10" style={S.h2}>Arquivos disponíveis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {years.map((year) => (
                <Link
                  key={year}
                  href="/dados"
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)" }}
                >
                  <div className="p-6 flex flex-col gap-4 h-full">
                    <p className="font-mono uppercase mb-1" style={{ fontSize: "11px", color: "var(--text-03)" }}>Sorocaba / SP</p>
                    <p className="font-mono font-medium" style={{ fontSize: "36px", color: "var(--text-01)" }}>{year}</p>
                    <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, color: "#005d5d", border: "1px solid #005d5d", borderRadius: "2px", padding: "1px 6px" }}>SEGURANÇA</span>
                    <div className="mt-auto flex items-center gap-2" style={{ color: "#005d5d", fontSize: "13px" }}>Ver dados publicados</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
