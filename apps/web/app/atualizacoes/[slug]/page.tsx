import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { ATUALIZACOES, getAtualizacao } from "@/lib/atualizacoes"
import { SITE_URL } from "@/lib/structured-data"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return ATUALIZACOES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const a = getAtualizacao(slug)
  if (!a) return {}
  return {
    title: `${a.titulo} — Anatomia do Gasto`,
    description: a.resumo,
    alternates: { canonical: `${SITE_URL}/atualizacoes/${a.slug}` },
    openGraph: {
      title: a.titulo,
      description: a.resumo,
      type: "article",
      publishedTime: a.data,
    },
  }
}

const S = {
  container: { maxWidth: "860px" } as React.CSSProperties,
  label:     { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  body:      { fontSize: "16px", lineHeight: "28px", color: "var(--text-02)" } as React.CSSProperties,
  caption:   { fontSize: "13px", color: "var(--text-04)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function renderCorpo(texto: string) {
  return texto.split("\n\n").map((bloco, i) => {
    if (bloco.startsWith("**") && bloco.endsWith("**")) {
      const titulo = bloco.slice(2, -2)
      return <h3 key={i} className="font-semibold mt-8 mb-3" style={{ fontSize: "15px", color: "var(--text-01)" }}>{titulo}</h3>
    }
    if (bloco.startsWith("- ") || bloco.includes("\n- ")) {
      const items = bloco.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2))
      return (
        <ul key={i} className="my-4 pl-5" style={{ ...S.body }}>
          {items.map((item, j) => (
            <li key={j} className="mb-1" style={{ listStyleType: "disc" }}>
              {item.includes("`")
                ? item.split("`").map((part, k) =>
                    k % 2 === 1
                      ? <code key={k} style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "13px", backgroundColor: "var(--bg-elevated)", padding: "1px 5px" }}>{part}</code>
                      : part
                  )
                : item
              }
            </li>
          ))}
        </ul>
      )
    }
    if (bloco.includes("`")) {
      const parts = bloco.split("`")
      return (
        <p key={i} className="my-4" style={S.body}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <code key={j} style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "13px", backgroundColor: "var(--bg-elevated)", padding: "1px 5px" }}>{part}</code>
              : part
          )}
        </p>
      )
    }
    if (bloco.startsWith("**")) {
      const [boldPart, ...rest] = bloco.split(":**")
      return (
        <p key={i} className="my-4" style={S.body}>
          <strong style={{ color: "var(--text-01)" }}>{boldPart.slice(2)}:</strong>
          {rest.join(":**")}
        </p>
      )
    }
    return <p key={i} className="my-4" style={S.body}>{bloco}</p>
  })
}

export default async function AtualizacaoPage({ params }: Props) {
  const { slug } = await params
  const a = getAtualizacao(slug)
  if (!a) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.titulo,
    datePublished: a.data,
    dateModified: a.data,
    url: `${SITE_URL}/atualizacoes/${a.slug}`,
    author: {
      "@type": "Organization",
      name: "Anatomia do Gasto",
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    description: a.resumo,
    keywords: a.tags.join(", "),
    inLanguage: "pt-BR",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntityOfPage: `${SITE_URL}/atualizacoes/${a.slug}`,
  }

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
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Link href="/atualizacoes" style={{ ...S.caption, textDecoration: "none" }}>
                ← Atualizações
              </Link>
              <time dateTime={a.data} style={{ ...S.label, color: "var(--teal-40)" }}>
                {formatDate(a.data)}
              </time>
            </div>
            <h1
              className="font-light mb-6"
              style={{ fontSize: "clamp(24px, 3.5vw, 40px)", lineHeight: "1.25", color: "var(--text-01)" }}
            >
              {a.titulo}
            </h1>
            <p style={{ ...S.body, color: "var(--text-03)", maxWidth: "680px" }}>
              {a.resumo}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
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
        </section>

        {/* Corpo */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div style={{ maxWidth: "720px" }}>
              {renderCorpo(a.corpo)}
            </div>
          </div>
        </section>

        {/* Datasets */}
        {a.datasets.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-10" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Dados relacionados</p>
              <div className="flex flex-wrap gap-3">
                {a.datasets.map((d) => (
                  <Link key={d.href} href={d.href} className="nav-link">
                    {d.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/atualizacoes" className="nav-link">← Todas as atualizações</Link>
            <Link href="/api/dados" className="nav-link">Catálogo de dados</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
