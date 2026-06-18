import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a Anatomia do Gasto. Uma pessoa real vai ler e responder — sem chatbot, sem triagem automática.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/contato" },
}

const EMAIL = "contato@anatomiadogasto.ong.br"

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
    fontSize: "22px",
    lineHeight: "30px",
    color: "var(--text-01)",
    fontWeight: 300,
    marginBottom: "12px",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const COMPROMISSOS = [
  {
    num: "01",
    texto: "Toda mensagem recebe confirmação de recebimento. A resposta completa vem quando a apuração permitir — não existe triagem automática, bot ou formulário que some no vácuo.",
  },
  {
    num: "02",
    texto:
      "Erros nos dados são corrigidos com errata pública — o histórico fica visível na página de metodologia.",
  },
  {
    num: "03",
    texto:
      "Parcerias acadêmicas ou institucionais são bem-vindas. Só são anunciadas quando documentadas.",
  },
  {
    num: "04",
    texto:
      "O projeto não aceita financiamento com interesse editorial, publicitário ou partidário.",
  },
]

export default function ContatoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Contato</p>
              <h1
                className="font-light mb-6"
                style={{
                  fontSize: "clamp(28px, 4vw, 48px)",
                  lineHeight: "1.2",
                  color: "var(--text-01)",
                  maxWidth: "720px",
                }}
              >
                Uma pessoa real vai ler e responder
              </h1>
              <p style={{ ...S.body, maxWidth: "580px" }}>
                O Anatomia do Gasto é mantido por uma pessoa. Toda mensagem enviada para o
                e-mail abaixo chega diretamente a quem pode ajudar — sem chatbot, sem triagem
                automática, sem formulário que some no vácuo.
              </p>
            </div>
          </div>
        </section>

        {/* E-mail principal */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>E-mail institucional</p>
            <a
              href={`mailto:${EMAIL}`}
              style={{
                display: "inline-block",
                fontSize: "clamp(18px, 2.5vw, 30px)",
                color: "var(--blue-40)",
                textDecoration: "none",
                fontFamily: "var(--font-ibm-plex-mono)",
                letterSpacing: "0.02em",
                borderBottom: "2px solid var(--blue-60)",
                paddingBottom: "4px",
              }}
            >
              {EMAIL}
            </a>
            <p className="mt-6" style={{ ...S.body, color: "var(--text-03)", maxWidth: "560px" }}>
              Use este endereço para qualquer dúvida sobre os dados, sugestão de melhoria,
              erro encontrado, pedido de parceria ou qualquer outro assunto relacionado ao projeto.
            </p>
          </div>
        </section>

        {/* Canais técnicos */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Para assuntos técnicos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              <div className="py-8 md:pr-12" style={S.borderBottom}>
                <h2 style={S.h2}>Erro nos dados</h2>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  Se você encontrar um número que não bate com a fonte oficial, abra uma
                  issue no repositório com o link do documento original. Corrigimos e
                  registramos em errata pública.
                </p>
                <a
                  href="https://github.com/sallumc2018/anatomia-do-gasto/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...S.mono, textDecoration: "underline" }}
                >
                  github.com/…/anatomia-do-gasto/issues
                </a>
              </div>
              <div
                className="mobile-indexed-cell py-8 md:pl-12"
                style={{
                  ...S.borderBottom,
                  borderLeft: "1px solid var(--border-01)",
                }}
              >
                <h2 style={S.h2}>Código e pipeline</h2>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  O código do site e o pipeline de extração de dados são abertos.
                  Pull requests e sugestões técnicas são bem-vindas via GitHub.
                </p>
                <a
                  href="https://github.com/sallumc2018/anatomia-do-gasto"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...S.mono, textDecoration: "underline" }}
                >
                  github.com/sallumc2018/anatomia-do-gasto
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Compromissos */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>O que esperar</p>
            <div className="flex flex-col gap-0" style={{ maxWidth: "720px", ...S.borderTop }}>
              {COMPROMISSOS.map((item) => (
                <div
                  key={item.num}
                  className="flex gap-8 items-start py-7"
                  style={S.borderBottom}
                >
                  <span
                    className="font-mono flex-shrink-0"
                    style={{ fontSize: "13px", color: "var(--text-04)", width: "28px" }}
                  >
                    {item.num}
                  </span>
                  <p style={S.body}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
