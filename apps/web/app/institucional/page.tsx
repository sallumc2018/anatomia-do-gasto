import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Institucional — Anatomia do Gasto",
  description:
    "Base institucional do Anatomia do Gasto: projeto civico em formacao, governanca minima, limites publicos e status pre-CNPJ.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/institucional" },
}

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

const PRINCIPIOS = [
  ["Transparencia verificavel", "Toda afirmacao publica precisa apontar para fonte, periodo, escopo e limite conhecido."],
  ["Neutralidade editorial", "O projeto organiza dados oficiais. Nao acusa pessoas, nao presume intencao e nao transforma inferencia em fato."],
  ["Codigo aberto", "Metodologia, validadores e trilhas de publicacao devem ser revisaveis por pares no GitHub."],
  ["Cuidado institucional", "Enquanto a associacao nao estiver formalizada, colaboracoes sao tratadas como contribuicao open-source, sem vinculo formal de voluntariado."],
]

const NAO_PROMETE = [
  "Representar uma pessoa juridica constituida antes da formalizacao e inscricao ativa no CNPJ.",
  "Oferecer horas complementares, certificados, cargos, vinculo de voluntariado formal ou relacao trabalhista.",
  "Publicar comparacoes, rankings ou notas sem metodologia e evidencia medida.",
  "Receber doacoes ou patrocinio com contrapartida editorial, publicitaria ou politica.",
]

export default function InstitucionalPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "760px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Institucional</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
              >
                Projeto civico em formacao, com regras publicas antes de crescer
              </h1>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                O Anatomia do Gasto organiza dados fiscais oficiais em linguagem cidada.
                A frente institucional esta em formacao: antes da constituicao juridica,
                o projeto assume limites explicitos e opera como iniciativa publica de
                codigo aberto, com revisao por pares e rastreabilidade.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Status juridico</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {[
                ["Hoje", "Projeto civico open-source em estruturacao institucional. Ainda sem comunicacao publica de CNPJ ativo neste site."],
                ["Proximo marco", "Formalizar estatuto, governanca, regras de contribuicao e canais oficiais antes de qualquer voluntariado formal."],
                ["Regra publica", "Toda colaboracao atual deve ser descrita como contribuicao ao projeto, nao como vinculo formal com ONG constituida."],
              ].map(([title, text], index) => (
                <div
                  key={title}
                  className="py-8 md:pr-8"
                  style={{
                    borderLeft: index > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: index > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ ...S.mono, color: "var(--blue-40)", marginBottom: "10px" }}>{title}</p>
                  <p style={S.body}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-10" style={S.label}>Principios operacionais</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {PRINCIPIOS.map(([title, text], index) => (
                <div
                  key={title}
                  className="py-8"
                  style={{
                    paddingRight: index % 2 === 0 ? "48px" : 0,
                    paddingLeft: index % 2 === 1 ? "48px" : 0,
                    borderLeft: index % 2 === 1 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <h2 style={{ ...S.h2, fontSize: "18px" }}>{title}</h2>
                  <p style={S.body}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>O que ainda nao prometemos</p>
            <ul className="flex flex-col gap-0" style={{ maxWidth: "860px", ...S.borderTop }}>
              {NAO_PROMETE.map((item) => (
                <li key={item} className="flex gap-5 items-start py-5" style={S.borderBottom}>
                  <span style={{ ...S.mono, flexShrink: 0, marginTop: "3px" }}>—</span>
                  <p style={S.body}>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Canais seguros agora</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {[
                ["/auditoria/reportar", "Reportar divergencia", "Canal neutro para apontar erro, lacuna ou fonte oficial divergente."],
                ["/api/dados", "Catalogo de dados", "Lista publica de arquivos realmente disponiveis em data/public."],
                ["/voluntarios", "Contribuir", "Entrada para colaboradores open-source, sem vinculo formal enquanto a associacao estiver em formacao."],
              ].map(([href, title, text], index) => (
                <Link
                  key={href}
                  href={href}
                  className="tile-link"
                  style={{
                    minHeight: "170px",
                    padding: "28px",
                    borderLeft: index > 0 ? "1px solid var(--border-01)" : "none",
                    ...S.borderBottom,
                  }}
                >
                  <h2 style={{ ...S.h2, fontSize: "18px" }}>{title}</h2>
                  <p style={S.body}>{text}</p>
                  <p className="mt-5" style={{ fontSize: "14px", color: "var(--blue-50)" }}>Abrir →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
