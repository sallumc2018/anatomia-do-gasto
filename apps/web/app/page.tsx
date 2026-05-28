import React from "react"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { AvisoMaturidade } from "@/components/ui/aviso-maturidade"
import TheoGuide from "@/components/theo/theo-guide"

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  },
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
}

const CIDADES = [
  {
    nome: "Sorocaba",
    uf: "SP",
    descricao: "730 mil hab. · Município piloto com cobertura auditável em expansão para 2020–2025.",
    status: "Disponível",
    href: "/sorocaba",
    ativo: true,
  },
  {
    nome: "Paulínia",
    uf: "SP",
    descricao: "115 mil hab. · Coleta de dados em andamento.",
    status: "Em breve",
    href: null,
    ativo: false,
  },
]

export default function IndexPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Anatomia do Gasto",
            "url": "https://www.anatomiadogasto.ong.br",
            "description": "ONG brasileira que organiza dados fiscais públicos em linguagem cidadã, com fonte declarada, limites explícitos e rastreabilidade completa.",
            "email": "contato@anatomiadogasto.ong.br",
            "sameAs": ["https://github.com/sallumc2018/anatomia-do-gasto"],
          }),
        }}
      />
      <AvisoMaturidade />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <p style={S.label}>Anatomia do Gasto</p>
            <h1
              className="font-semibold mt-3"
              style={{
                fontSize: "clamp(26px, 3.5vw, 42px)",
                lineHeight: "1.12",
                color: "var(--text-01)",
                marginBottom: "16px",
              }}
            >
              Dados fiscais públicos em linguagem cidadã
            </h1>
            <p
              style={{
                ...S.body,
                fontSize: "15px",
                lineHeight: "24px",
                color: "var(--text-03)",
                maxWidth: "560px",
              }}
            >
              ONG independente que organiza contas municipais com fonte declarada,
              limites explícitos e rastreabilidade completa — sem vínculo com partidos ou governos.
            </p>
          </div>
        </section>

        {/* Seletor de municípios */}
        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={{ ...S.label, marginBottom: "24px" }}>Municípios cobertos</p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ borderTop: "1px solid var(--border-01)", borderLeft: "1px solid var(--border-01)" }}
            >
              {CIDADES.map((cidade) => {
                const inner = (
                  <>
                    <p
                      style={{
                        ...S.label,
                        color: cidade.ativo ? "var(--blue-40)" : "var(--text-04)",
                      }}
                    >
                      {cidade.status}
                    </p>
                    <h2
                      className="font-semibold mt-3"
                      style={{
                        fontSize: "22px",
                        color: cidade.ativo ? "var(--text-01)" : "var(--text-04)",
                      }}
                    >
                      {cidade.nome}{" "}
                      <span style={{ fontWeight: 300, fontSize: "18px" }}>{cidade.uf}</span>
                    </h2>
                    <p className="mt-2" style={{ ...S.body, color: "var(--text-03)", fontSize: "13px" }}>
                      {cidade.descricao}
                    </p>
                    {cidade.ativo && (
                      <p className="mt-5" style={{ fontSize: "14px", color: "var(--blue-50)" }}>
                        Ver dados →
                      </p>
                    )}
                  </>
                )

                const cardStyle: React.CSSProperties = {
                  borderRight: "1px solid var(--border-01)",
                  borderBottom: "1px solid var(--border-01)",
                  minHeight: "180px",
                  padding: "32px",
                }

                return cidade.ativo ? (
                  <Link
                    key={cidade.nome}
                    href={cidade.href!}
                    className="tile-link"
                    style={cardStyle}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={cidade.nome}
                    style={{ ...cardStyle, opacity: 0.55, cursor: "default" }}
                  >
                    {inner}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Théo em destaque */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={{ ...S.label, marginBottom: "8px", color: "var(--blue-40)" }}>Guia de dados · Sorocaba</p>
            <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "24px", maxWidth: "480px" }}>
              Tem dúvidas sobre os dados de Sorocaba? O Théo responde em linguagem simples e aponta para a página certa.
            </p>
            <TheoGuide />
          </div>
        </section>

        {/* Links de contexto */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-wrap gap-6">
              {[
                { href: "/sobre", label: "Sobre a ONG" },
                { href: "/metodologia", label: "Metodologia e fontes" },
                { href: "/contato", label: "Contato" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  style={{ fontSize: "14px" }}
                >
                  {link.label}
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
