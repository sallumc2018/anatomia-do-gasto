import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import RankingLista from "@/components/auditoria/ranking-lista"

export const metadata: Metadata = {
  title: "Ranking de Agentes",
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
                Ranking de Agentes Políticos
              </h1>
              <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "620px" }}>
                Protótipo de classificação para testar critérios de execução, distribuição de recursos e transparência.
              </p>
            </div>
          </div>
        </section>
        <section style={{ backgroundColor: "var(--bg-base)", paddingTop: "48px", paddingBottom: "64px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>
            <div style={{ width: "100%", marginBottom: "40px" }}>
              <p style={{ fontSize: "16px", lineHeight: "24px", color: "var(--text-02)", marginBottom: "16px" }}>
                O ranking abaixo ainda é um protótipo com dados fictícios. Ele mostra como a pontuação será calculada
                quando a coleta real de emendas estiver ativa, sem juízo de valor pessoal.
              </p>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginBottom: "8px" }}>
                <strong>Critérios que aumentam a pontuação:</strong><br />
                · Alta taxa de execução (≥ 80% das emendas pagas)<br />
                · Distribuição dos recursos entre múltiplas entidades<br />
                · Entidades com CNPJ ativo e regular<br />
                · Dados completos e transparentes<br /><br />
                <strong>Critérios que reduzem a pontuação:</strong><br />
                · Baixa execução (&lt; 30% pago após 6 meses)<br />
                · Concentração em uma única entidade<br />
                · Entidade com CNPJ irregular<br />
                · Dados ausentes ou que exigiriam LAI não respondida
              </p>
              <p style={{ fontSize: "14px", lineHeight: "22px", color: "var(--text-03)", marginBottom: "8px" }}>
                <strong>Selos:</strong><br />
                <span style={{ color: "var(--blue-40)" }}>Excelente</span> (≥ 80) ·{" "}
                <span style={{ color: "#f1c21b" }}>Regular</span> (≥ 60) ·{" "}
                <span style={{ color: "#f1c21b" }}>Atenção</span> (≥ 30) ·{" "}
                <span style={{ color: "#fa4d56" }}>Crítico</span> (&lt; 30)
              </p>
              <p style={{ fontSize: "13px", lineHeight: "20px", color: "var(--text-04)", marginTop: "12px", padding: "12px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                <strong>Atenção:</strong> Os dados exibidos atualmente são exemplos fictícios (mock) para desenvolvimento.
                O ranking será atualizado trimestralmente quando a coleta real for ativa.
              </p>
            </div>
            <RankingLista />
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
