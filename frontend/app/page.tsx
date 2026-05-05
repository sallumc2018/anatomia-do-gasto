import React from "react"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
}

export default function IndexPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Escolha uma área para análise
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mt-8">
                <Link href="/saude" className="tile-link" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                  <div className="p-8 flex flex-col gap-4">
                    <p style={S.label}>Área</p>
                    <p className="font-mono font-medium" style={{ fontSize: "32px", color: "var(--text-01)" }}>Saúde</p>
                    <div className="mt-4 flex items-center gap-2" style={{ color: "var(--blue-50)", fontSize: "14px" }}>
                      Acessar painel
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link href="/educacao" className="tile-link" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                  <div className="p-8 flex flex-col gap-4">
                    <p style={S.label}>Área</p>
                    <p className="font-mono font-medium" style={{ fontSize: "32px", color: "var(--text-01)" }}>Educação</p>
                    <div className="mt-4 flex items-center gap-2" style={{ color: "var(--blue-50)", fontSize: "14px" }}>
                      Acessar painel
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <h2 className="font-light mb-8" style={{ fontSize: "22px", lineHeight: "30px", color: "var(--text-01)" }}>
              Outras ferramentas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
              <Link href="/auditoria" className="tile-link" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}>
                <div className="p-8 flex flex-col gap-4">
                  <p style={S.label}>Trilha de Auditoria</p>
                  <p className="font-mono font-medium" style={{ fontSize: "32px", color: "var(--text-01)" }}>Agentes Políticos</p>
                  <p style={{ ...S.body, fontSize: "14px", color: "var(--text-03)" }}>
                    Remuneração e emendas de vereadores e deputados que atuam em Sorocaba.
                  </p>
                  <div className="mt-4 flex items-center gap-2" style={{ color: "var(--blue-50)", fontSize: "14px" }}>
                    Acessar auditoria
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>

              <Link href="/auditoria/ranking" className="tile-link" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}>
                <div className="p-8 flex flex-col gap-4">
                  <p style={S.label}>Trilha de Auditoria</p>
                  <p className="font-mono font-medium" style={{ fontSize: "32px", color: "var(--text-01)" }}>Ranking</p>
                  <p style={{ ...S.body, fontSize: "14px", color: "var(--text-03)" }}>
                    Classificação objetiva dos agentes políticos com base em critérios de execução e transparência.
                  </p>
                  <div className="mt-4 flex items-center gap-2" style={{ color: "var(--blue-50)", fontSize: "14px" }}>
                    Acessar ranking
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
