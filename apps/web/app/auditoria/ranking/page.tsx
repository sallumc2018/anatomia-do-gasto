import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Ranking de agentes — em construção",
  robots: { index: false, follow: false },
}

export default function RankingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", paddingTop: "48px", paddingBottom: "48px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", fontWeight: 300, marginBottom: "16px" }}>
                Ranking de agentes
              </h1>
              <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "620px" }}>
                Esta funcionalidade está em construção e será publicada quando houver dados reais de execução orçamentária por vereador.
              </p>
            </div>
          </div>
        </section>
        <section style={{ backgroundColor: "var(--bg-base)", paddingTop: "48px", paddingBottom: "64px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>
            <p style={{ fontSize: "14px", color: "var(--text-03)" }}>
              ← <a href="/auditoria" style={{ color: "var(--blue-50)", textDecoration: "underline" }}>Voltar para subsídios dos agentes políticos</a>
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
