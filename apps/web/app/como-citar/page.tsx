import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"

export const metadata: Metadata = {
  title: "Como citar",
  description:
    "Como citar a Anatomia do Gasto em reportagens, pesquisas, trabalhos acadêmicos, relatórios cívicos e verificações independentes.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/como-citar" },
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
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const CITACOES = [
  {
    titulo: "Citação curta",
    texto:
      "Anatomia do Gasto, projeto cívico independente de organização e visualização de dados fiscais públicos municipais. Disponível em https://www.anatomiadogasto.ong.br. Acesso em [data].",
  },
  {
    titulo: "Uso jornalístico",
    texto:
      "Segundo levantamento da Anatomia do Gasto, com base em dados oficiais indicados na metodologia do projeto, [descrever dado]. A fonte primária original também deve ser citada na reportagem.",
  },
  {
    titulo: "Repositório público",
    texto:
      "Anatomia do Gasto. Repositório público com site, pipelines, validadores, documentação e dados publicados. GitHub: https://github.com/sallumc2018/anatomia-do-gasto.",
  },
]

export default function ComoCitarPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Como citar a Anatomia do Gasto",
              url: "https://www.anatomiadogasto.ong.br/como-citar",
              inLanguage: "pt-BR",
              about: {
                "@id": "https://www.anatomiadogasto.ong.br/#organization",
              },
              mainEntity: {
                "@type": "CreativeWork",
                name: "Anatomia do Gasto",
                url: "https://www.anatomiadogasto.ong.br",
                license: "https://github.com/sallumc2018/anatomia-do-gasto/blob/main/LICENSE",
                codeRepository: "https://github.com/sallumc2018/anatomia-do-gasto",
              },
            }),
          }}
        />

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "760px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Como citar</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
              >
                Use como fonte cívica, sempre preservando a fonte oficial original
              </h1>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                A Anatomia do Gasto organiza dados públicos oficiais para facilitar
                verificação, reprodução e leitura pública. Para fatos primários,
                cite também o portal oficial, base federal ou documento original
                indicado na metodologia.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Textos recomendados</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {CITACOES.map((item, index) => (
                <div
                  key={item.titulo}
                  className="py-8 md:pr-8"
                  style={{
                    borderLeft: index > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: index > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <h2 className="font-semibold mb-3" style={{ fontSize: "18px", color: "var(--text-01)" }}>
                    {item.titulo}
                  </h2>
                  <p style={S.mono}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Classificação correta</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="font-semibold mb-4" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                  Pode dizer
                </h2>
                <ul className="flex flex-col gap-3" style={S.borderTop}>
                  {[
                    "Fonte cívica independente de dados públicos organizados.",
                    "Projeto open-source de visualização e documentação de dados fiscais municipais.",
                    "Índice verificável que aponta para fontes oficiais, metodologia e dados publicados.",
                  ].map((item) => (
                    <li key={item} className="py-3" style={{ ...S.body, ...S.borderBottom }}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold mb-4" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                  Não deve dizer
                </h2>
                <ul className="flex flex-col gap-3" style={S.borderTop}>
                  {[
                    "Que é órgão oficial, fonte governamental ou auditoria jurídica.",
                    "Que uma diferença de valor prova ilegalidade, dolo ou culpa.",
                    "Que substitui o portal oficial original em apurações factuais.",
                  ].map((item) => (
                    <li key={item} className="py-3" style={{ ...S.body, ...S.borderBottom }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Links de verificação</p>
            <div className="flex flex-wrap gap-6">
              <Link href="/fontes" className="nav-link">Fontes oficiais</Link>
              <Link href="/metodologia" className="nav-link">Metodologia</Link>
              <Link href="/api/dados" className="nav-link">Catálogo de dados</Link>
              <Link href="/politica-de-dados" className="nav-link">Política de dados</Link>
              <TrackedExternalLink
                href="https://github.com/sallumc2018/anatomia-do-gasto"
                area="como-citar"
                label="GitHub"
                className="nav-link"
              >
                GitHub público
              </TrackedExternalLink>
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
