import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página solicitada não existe ou não há dados para os parâmetros informados.",
  robots: { index: false, follow: true },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1 flex items-center">
        <div className="mx-auto px-6 py-24" style={S.container}>
          <div style={{ borderLeft: "4px solid var(--theme-accent)", paddingLeft: "24px", maxWidth: "640px" }}>
            <p className="uppercase font-semibold mb-3" style={S.label}>
              Erro 404
            </p>
            <h1
              className="font-light mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
            >
              Página não encontrada
            </h1>
            <p style={{ ...S.body, marginBottom: "8px" }}>
              O endereço que você acessou não existe — ou não há dados publicados para os
              parâmetros informados (por exemplo, um ano ou fornecedor sem registros).
            </p>
            <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "24px" }}>
              Dado ausente não é zero: quando não temos a informação, não exibimos a página
              em vez de mostrar valores fabricados.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/" className="nav-link">← Início</Link>
              <Link href="/sorocaba" className="nav-link">Sorocaba</Link>
              <Link href="/paulinia" className="nav-link">Paulínia</Link>
              <Link href="/sao-paulo" className="nav-link">São Paulo</Link>
              <Link href="/api/dados" className="nav-link">Catálogo de dados</Link>
            </div>
          </div>
        </div>
      </main>
      <PageFooter />
    </div>
  )
}
