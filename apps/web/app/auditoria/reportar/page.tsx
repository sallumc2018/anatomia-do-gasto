import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Reportar divergencia — Anatomia do Gasto",
  description:
    "Canal neutro para reportar divergencia, lacuna ou fonte oficial relacionada aos dados publicados pelo Anatomia do Gasto.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/auditoria/reportar" },
}

const EMAIL = "contato@anatomiadogasto.ong.br"

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
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
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const CHECKLIST = [
  "Pagina ou arquivo onde voce encontrou a divergencia.",
  "Valor, texto ou link que parece incorreto ou incompleto.",
  "Fonte oficial que permite conferir a informacao.",
  "Data de acesso da fonte e periodo a que o dado se refere.",
  "Descricao factual do problema, sem acusacao ou inferencia de intencao.",
]

const FLUXO = [
  ["Recebimento", "A mensagem entra como relato a verificar, nao como fato confirmado."],
  ["Triagem", "A equipe compara o relato com a fonte oficial e com os manifests publicos."],
  ["Correcao", "Se houver erro confirmado no projeto, a correcao fica registrada em commit, issue ou nota publica."],
  ["Limite", "Se a fonte oficial for ambigua, a pagina passa a declarar a limitacao em vez de preencher lacuna por inferencia."],
]

export default function ReportarDivergenciaPage() {
  const subject = encodeURIComponent("Divergencia nos dados - Anatomia do Gasto")
  const body = encodeURIComponent(
    [
      "Pagina ou arquivo:",
      "Fonte oficial:",
      "Periodo:",
      "Descricao factual:",
      "Observacoes:",
    ].join("\n\n")
  )

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "760px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Auditoria cidada</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
              >
                Reporte uma divergencia sem transformar suspeita em acusacao
              </h1>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                Este canal serve para apontar erro, lacuna, link quebrado ou fonte oficial
                divergente. O relato inicia verificacao; ele nao publica acusacao e nao
                presume irregularidade.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Antes de enviar</p>
            <ul className="flex flex-col gap-0" style={{ maxWidth: "820px", ...S.borderTop }}>
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-5 items-start py-5" style={S.borderBottom}>
                  <span style={{ ...S.mono, color: "var(--blue-40)", flexShrink: 0, marginTop: "3px" }}>✓</span>
                  <p style={S.body}>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Enviar relato</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              <div className="py-8 md:pr-12" style={S.borderBottom}>
                <h2 style={S.h2}>E-mail</h2>
                <p style={{ ...S.body, marginBottom: "18px" }}>
                  Use e-mail quando houver contexto, documentos ou explicacao curta.
                  Nao envie senhas, documentos privados, dados pessoais sensiveis ou arquivos
                  que nao possam ser publicados.
                </p>
                <a
                  href={`mailto:${EMAIL}?subject=${subject}&body=${body}`}
                  style={{ ...S.mono, color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  {EMAIL}
                </a>
              </div>
              <div className="py-8 md:pl-12" style={{ borderLeft: "1px solid var(--border-01)", ...S.borderBottom }}>
                <h2 style={S.h2}>GitHub</h2>
                <p style={{ ...S.body, marginBottom: "18px" }}>
                  Use issue publica quando a divergencia puder ser revisada por qualquer pessoa,
                  com fonte oficial e linguagem neutra.
                </p>
                <a
                  href="https://github.com/sallumc2018/anatomia-do-gasto/issues/new/choose"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...S.mono, color: "var(--blue-40)", textDecoration: "underline" }}
                >
                  abrir issue no GitHub
                </a>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Como tratamos o relato</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0" style={S.borderTop}>
              {FLUXO.map(([title, text], index) => (
                <div
                  key={title}
                  className="py-8 md:pr-8"
                  style={{
                    borderLeft: index > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: index > 0 ? "28px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ ...S.mono, color: "var(--blue-40)", marginBottom: "10px" }}>{title}</p>
                  <p style={{ ...S.body, fontSize: "14px" }}>{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "760px" }}>
              Para entender a politica de publicacao e os limites do projeto, leia tambem{" "}
              <Link href="/politica-de-dados" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                Politica de Dados
              </Link>
              {" "}e{" "}
              <Link href="/politica-de-neutralidade" style={{ color: "var(--blue-40)", textDecoration: "underline" }}>
                Politica de Neutralidade
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
