import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { APRENDIZADO } from "@/lib/aprendizado"

export const metadata: Metadata = {
  title: "Fundador — Alexandre Sallum Cunha · Anatomia do Gasto",
  description: "Como o Anatomia do Gasto nasceu: a história de um cidadão inconformado que decidiu rastrear o dinheiro público do Brasil em linguagem acessível.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sobre/fundador" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase" as const,
  },
  h2: {
    fontSize: "22px",
    lineHeight: "30px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "12px",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "26px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

export default function FundadorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-3" style={S.container}>
            <p style={{ ...S.caption, color: "var(--text-04)" }}>
              <Link href="/sobre" style={{ color: "var(--text-04)", textDecoration: "underline" }}>Sobre</Link>
              {" / "}
              Fundador
            </p>
          </div>
        </div>

        {/* Hero — fundador */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Fundador</p>
              <h1 className="font-light mb-8" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                Alexandre Sallum Cunha
              </h1>
              <p style={{ ...S.body, marginBottom: "20px" }}>
                Estudei informática no COPI/FIAP, escrevi meu primeiro HTML aos 15 anos, passei por ASP, Java
                e cheguei ao último mês de Análise e Desenvolvimento de Sistemas quando a saúde interrompeu tudo.
                A vida foi para logística e suporte técnico. A tecnologia ficou esperando.
              </p>
              <p style={{ ...S.body, marginBottom: "20px" }}>
                Quando o debate sobre o Banco Master começou, ouvi alguém mencionar a Operação Serenata de Amor —
                uma ONG que encontrava irregularidades pelos dados públicos dos políticos. Perguntei a mim mesmo:
                por que não rastrear o Brasil inteiro de forma que o cidadão comum entenda como isso afeta a vida
                dele diretamente?
              </p>
              <p style={S.body}>
                Não foi irritação. Foi inconformidade. Um país tão rico sendo destruído pela corrupção
                enquanto os dados que provam tudo isso estão disponíveis e ninguém olha.
              </p>
            </div>
          </div>
        </section>

        {/* O primeiro tropeço */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>O primeiro tropeço</p>
            <div style={{ borderLeft: "2px solid var(--border-02)", paddingLeft: "24px", maxWidth: "640px" }}>
              <p style={{ ...S.body, fontStyle: "italic", color: "var(--text-01)" }}>
                A primeira barreira não foi escrever código — foi montar o ambiente: conectar ferramentas que
                ainda não conversavam entre si e entender a ordem certa de cada etapa. Qualquer pessoa que já
                construiu algo do zero vai reconhecer esse momento. Quando tudo encaixou, ficou claro que o
                resto era questão de tempo e disciplina.
              </p>
            </div>
          </div>
        </section>

        {/* Continuo aprendendo */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Continuo aprendendo</p>
            <p style={{ ...S.body, marginBottom: "40px", color: "var(--text-03)" }}>
              Cada curso alimenta diretamente o projeto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {APRENDIZADO.map((item, i) => (
                <div
                  key={item.curso}
                  className="py-8"
                  style={{
                    paddingRight: i < APRENDIZADO.length - 1 ? "32px" : 0,
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: i > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        backgroundColor: item.status === "concluído" ? "var(--green-80)" : "var(--blue-80)",
                        color: item.status === "concluído" ? "var(--green-30)" : "var(--blue-30)",
                      }}
                    >
                      {item.status === "concluído" ? `✓ ${item.data}` : "em andamento"}
                    </span>
                  </div>
                  <h2 style={{ ...S.h2, fontSize: "16px", marginBottom: "4px" }}>{item.curso}</h2>
                  <p style={{ ...S.caption, marginBottom: "12px", color: "var(--text-03)" }}>{item.instituicao}</p>
                  <p style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>{item.aplicacao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Voltar */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <Link href="/sobre" style={{ fontSize: "14px", color: "var(--blue-40)", textDecoration: "underline" }}>
              ← Voltar para Sobre a ONG
            </Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
