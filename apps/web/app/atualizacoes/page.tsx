import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { ATUALIZACOES } from "@/lib/atualizacoes"
import { SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Atualizações de dados",
  description:
    "Changelog público de lançamentos e atualizações de dados do Anatomia do Gasto. Novos municípios, séries históricas e expansões de cobertura.",
  alternates: { canonical: `${SITE_URL}/atualizacoes` },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label:     { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  body:      { fontSize: "15px", lineHeight: "24px", color: "var(--text-02)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
  borderTop:    { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Atualizações de dados — Anatomia do Gasto",
  url: `${SITE_URL}/atualizacoes`,
  itemListElement: ATUALIZACOES.map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "BlogPosting",
      headline: a.titulo,
      datePublished: a.data,
      url: `${SITE_URL}/atualizacoes/${a.slug}`,
      author: { "@type": "Organization", name: "Anatomia do Gasto", url: SITE_URL },
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: a.resumo,
      keywords: a.tags.join(", "),
    },
  })),
}

export default function AtualizacoesPage() {
  const ordenadas = [...ATUALIZACOES].sort((a, b) => b.data.localeCompare(a.data))

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px", maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Changelog público</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
              >
                Atualizações de dados
              </h1>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                Registro público de lançamentos, expansões de cobertura e atualizações de séries históricas.
                Cada entrada tem fonte, metodologia e links diretos para os dados publicados.
              </p>
            </div>
          </div>
        </section>

        {/* Lista */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div style={S.borderTop}>
              {ordenadas.map((a) => (
                <article
                  key={a.id}
                  className="py-10"
                  style={S.borderBottom}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 md:gap-12">
                    {/* Data + tags */}
                    <div>
                      <time dateTime={a.data} style={{ ...S.label, color: "var(--teal-40)" }}>
                        {formatDate(a.data)}
                      </time>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {a.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              padding: "2px 7px",
                              border: "1px solid var(--border-02)",
                              color: "var(--text-04)",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div>
                      <Link
                        href={`/atualizacoes/${a.slug}`}
                        style={{ textDecoration: "none" }}
                      >
                        <h2
                          className="font-light mb-3 hover:opacity-80 transition-opacity"
                          style={{ fontSize: "22px", lineHeight: "1.35", color: "var(--text-01)" }}
                        >
                          {a.titulo}
                        </h2>
                      </Link>
                      <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                        {a.resumo}
                      </p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <Link href={`/atualizacoes/${a.slug}`} className="nav-link" style={{ fontSize: "13px" }}>
                          Ler mais →
                        </Link>
                        {a.datasets.slice(0, 2).map((d) => (
                          <Link
                            key={d.href}
                            href={d.href}
                            className="nav-link"
                            style={{ fontSize: "12px", color: "var(--text-04)" }}
                          >
                            {d.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
