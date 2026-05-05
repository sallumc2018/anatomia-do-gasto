import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TabelaPerfis from "@/components/auditoria/tabela-perfis"

export default function AuditoriaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main className="flex-1" style={{ backgroundColor: "var(--bg-base)", width: "100%" }}>
        <div style={{ width: "100%", padding: "0 24px 64px" }}>
          <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", marginBottom: "48px" }}>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", fontWeight: 300, marginBottom: "16px" }}>
              Auditoria de Agentes Políticos
            </h1>
            <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "620px" }}>
              Remuneração, emendas de saúde e execução financeira dos representantes que atuam em Sorocaba.
            </p>
          </div>
          <div style={{ width: "100%", marginBottom: "40px" }}>
            <p style={{ fontSize: "16px", lineHeight: "24px", color: "var(--text-02)", marginBottom: "16px" }}>
              Esta trilha de auditoria reúne <strong>todos os agentes políticos</strong> com atuação em Sorocaba que
              destinaram emendas para a saúde ou recebem remuneração do erário municipal, estadual ou federal.
              O critério de inclusão é objetivo: o agente aparece se movimentou dinheiro público com impacto
              na saúde do município.
            </p>
            <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginBottom: "8px" }}>
              <strong>Salário Bruto:</strong> valor declarado no portal da transparência (fonte oficial).<br />
              <strong>Emendas (Empenhado):</strong> total que o parlamentar destinou em emendas de saúde no ano de referência.<br />
              <strong>Total Pago:</strong> quanto desse total já foi efetivamente transferido à entidade.<br />
              <strong>Taxa de Execução:</strong> percentual do empenhado que já foi pago.
              <span style={{ color: "var(--blue-40)" }}> Verde</span> ≥ 80%,
              <span style={{ color: "#f1c21b" }}> Amarelo</span> ≥ 30%,
              <span style={{ color: "#fa4d56" }}> Vermelho</span> &lt; 30%.
            </p>
            <p style={{ fontSize: "13px", lineHeight: "20px", color: "var(--text-04)", marginTop: "12px", padding: "12px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
              ⚠️ <strong>Atenção:</strong> Os dados exibidos atualmente são exemplos fictícios (mock) para desenvolvimento.
              A coleta automatizada de dados reais está em implementação.
              Os valores, nomes e entidades aqui apresentados são ilustrativos.
              Veja o <a href="https://github.com/sallumc2018/anatomia-do-gasto/blob/main/docs/auditoria/01-fontes.md" style={{ color: "var(--blue-50)" }}>plano de fontes</a> e
              o <a href="https://github.com/sallumc2018/anatomia-do-gasto/blob/main/docs/auditoria/README.md" style={{ color: "var(--blue-50)" }}>escopo da auditoria</a>.
            </p>
          </div>
          <TabelaPerfis />
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
