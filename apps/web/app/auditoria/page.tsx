import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TabelaPerfis from "@/components/auditoria/tabela-perfis"

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
            <div style={{ width: "100%", marginBottom: "40px" }}>
              <p style={{ fontSize: "16px", lineHeight: "24px", color: "var(--text-02)", marginBottom: "16px" }}>
                Esta trilha de auditoria ainda está em desenvolvimento. Os subsídios brutos mensais usam referência
                oficial por cargo; os exemplos de emendas, entidades, execução financeira e ranking continuam
                fictícios até a coleta real ser ativada.
              </p>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginBottom: "8px" }}>
                <strong>Subsídio mensal oficial:</strong> valor bruto mensal publicado para o cargo.<br />
                <strong>Emendas (exemplo):</strong> total fictício destinado em emendas de saúde.<br />
                <strong>Total pago (exemplo):</strong> valor fictício transferido à entidade.<br />
                <strong>Taxa de execução (exemplo):</strong> percentual fictício pago.
                <span style={{ color: "var(--blue-40)" }}> Verde</span> ≥ 80%,
                <span style={{ color: "#f1c21b" }}> Amarelo</span> ≥ 30%,
                <span style={{ color: "#fa4d56" }}> Vermelho</span> &lt; 30%.
              </p>
              <p style={{ fontSize: "13px", lineHeight: "20px", color: "var(--text-04)", marginTop: "12px", padding: "12px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                <strong>Atenção:</strong> Emendas, entidades e ranking exibidos atualmente são exemplos fictícios (mock) para desenvolvimento.
                A coleta automatizada de dados reais está em implementação. Os subsídios são referência oficial por cargo.
                Veja o <a href="https://github.com/sallumc2018/anatomia-do-gasto/blob/main/docs/auditoria/01-fontes.md" style={{ color: "var(--blue-50)" }}>plano de fontes</a> e
                o <a href="https://github.com/sallumc2018/anatomia-do-gasto/blob/main/docs/auditoria/README.md" style={{ color: "var(--blue-50)" }}>escopo da auditoria</a>.
              </p>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginTop: "16px" }}>
                📊 <a href="/auditoria/ranking" style={{ color: "var(--blue-50)", textDecoration: "underline" }}>Ver ranking completo dos agentes políticos</a>
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
