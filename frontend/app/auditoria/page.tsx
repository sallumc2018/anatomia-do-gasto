import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TabelaPerfis from "@/components/auditoria/tabela-perfis"

export default function AuditoriaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main className="flex-1" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="mx-auto px-6 py-16" style={{ maxWidth: "1312px" }}>
          <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", marginBottom: "48px" }}>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", fontWeight: 300, marginBottom: "16px" }}>
              Auditoria de Agentes Políticos
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "620px" }}>
              Remuneração, emendas de saúde e execução financeira dos representantes que atuam em Sorocaba.
            </p>
          </div>
          <TabelaPerfis />
        </div>
      </main>
      <PageFooter />
    </div>
  )
}