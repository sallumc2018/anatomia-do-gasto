import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TabelaPerfis from "@/components/auditoria/tabela-perfis"

export const metadata: Metadata = {
  title: "Auditoria",
  description: "Subsídios oficiais de agentes políticos de Sorocaba e trilha de auditoria de emendas parlamentares. Dados em desenvolvimento.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/auditoria" },
  robots: { index: false, follow: false },
}

export default function AuditoriaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", paddingTop: "48px", paddingBottom: "48px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", fontWeight: 300, marginBottom: "16px" }}>
                Auditoria de Agentes Políticos
              </h1>
              <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "620px" }}>
                Subsídios oficiais por cargo e trilhas simuladas de emendas para desenvolvimento da auditoria.
              </p>
            </div>
          </div>
        </section>
        <section style={{ backgroundColor: "var(--bg-base)", paddingTop: "48px", paddingBottom: "64px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>

            {/* Aviso de dados em desenvolvimento — primeiro elemento visível */}
            <div style={{ marginBottom: "32px", padding: "16px 20px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", borderLeft: "4px solid #f1c21b" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-01)", marginBottom: "6px" }}>
                Dados em desenvolvimento — parte do conteúdo abaixo é fictício
              </p>
              <p style={{ fontSize: "13px", lineHeight: "20px", color: "var(--text-03)" }}>
                Os <strong>subsídios mensais</strong> são referência oficial por cargo.
                As colunas de <strong>emendas, entidades e ranking</strong> são exemplos fictícios usados para estruturar a trilha de auditoria.
                A coleta automatizada de dados reais está em implementação.
              </p>
            </div>

            <div style={{ width: "100%", marginBottom: "32px" }}>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginBottom: "8px" }}>
                <strong>Subsídio mensal oficial:</strong> valor bruto mensal publicado para o cargo.<br />
                <strong>Emendas (exemplo):</strong> total fictício destinado em emendas de saúde.<br />
                <strong>Total pago (exemplo):</strong> valor fictício transferido à entidade.<br />
                <strong>Taxa de execução (exemplo):</strong> percentual fictício pago.
                <span style={{ color: "var(--blue-40)" }}> Verde</span> ≥ 80%,
                <span style={{ color: "#f1c21b" }}> Amarelo</span> ≥ 30%,
                <span style={{ color: "#fa4d56" }}> Vermelho</span> &lt; 30%.
              </p>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginTop: "12px" }}>
                <a href="/auditoria/ranking" style={{ color: "var(--blue-50)", textDecoration: "underline" }}>Ver ranking completo dos agentes políticos</a>
              </p>
            </div>
            <TabelaPerfis />
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
