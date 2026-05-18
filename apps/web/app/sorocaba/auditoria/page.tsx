import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TabelaPerfis from "@/components/auditoria/tabela-perfis"

export const metadata: Metadata = {
  title: "Agentes políticos — subsídios",
  description: "Subsídios oficiais do Prefeito, Vice-prefeito e dos 25 Vereadores de Sorocaba/SP. Mandato 2025–2028.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/auditoria" },
}

export default function AuditoriaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={{ maxWidth: "1312px" }}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", fontWeight: 300, marginBottom: "16px" }}>
                Agentes políticos de Sorocaba
              </h1>
              <p style={{ fontSize: "16px", lineHeight: "26px", color: "var(--text-02)", maxWidth: "680px" }}>
                Subsídios brutos mensais por cargo do Executivo e do Legislativo municipal.
                Valores oficiais publicados pela Prefeitura e pela Câmara — mandato 2025–2028 (19ª Legislatura).
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", paddingTop: "48px", paddingBottom: "64px" }}>
          <div className="mx-auto px-6" style={{ maxWidth: "1312px" }}>

            <div style={{ marginBottom: "28px", padding: "14px 18px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", fontSize: "13px", lineHeight: "20px", color: "var(--text-03)" }}>
              <strong style={{ color: "var(--text-02)" }}>O que são subsídios?</strong>{" "}
              Subsídio é a remuneração fixada em lei para agentes políticos (cargos eletivos e comissionados de alto escalão).
              É bruto — sobre ele incidem contribuição previdenciária e IRPF.
              Não inclui verba de gabinete, diárias ou gratificações eventuais.
            </div>

            <TabelaPerfis />

            <div style={{ marginTop: "40px", paddingTop: "32px", borderTop: "1px solid var(--border-01)" }}>
              <p style={{ fontSize: "13px", color: "var(--text-03)", lineHeight: "20px" }}>
                <strong>Fontes:</strong> Tabela de Salários 2025 da Prefeitura de Sorocaba (jul/2025) ·
                Resolução Câmara Municipal de Sorocaba (jan/2026) ·
                Posse da 19ª Legislatura (jan/2025)
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-03)", lineHeight: "20px", marginTop: "8px" }}>
                Próximas adições: verba de gabinete por vereador · detalhamento de contratos (PNCP) ·
                presença em sessões plenárias.
              </p>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
