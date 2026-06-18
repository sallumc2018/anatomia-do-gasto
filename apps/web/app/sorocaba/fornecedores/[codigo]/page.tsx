import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsFornecedores,
  loadFornecedores,
  type FornecedorRow,
} from "@/lib/data"

const CLASS_LABEL: Record<string, string> = {
  folha:                        "Folha de pagamento",
  entidade_sem_fins_lucrativos: "Entidade sem fins lucrativos",
  empresa_privada:              "Empresa privada",
  fundo_publico:                "Fundo público",
  a_classificar:                "Não classificado",
}

const CLASS_COLOR: Record<string, string> = {
  folha:                        "var(--blue-40)",
  entidade_sem_fins_lucrativos: "var(--teal-40)",
  empresa_privada:              "var(--purple-40)",
  fundo_publico:                "var(--cyan-40)",
  a_classificar:                "var(--text-04)",
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return `R$ ${(v / 1e3).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mil`
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

interface PageProps {
  params: Promise<{ codigo: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { codigo } = await params
  const anos = getAvailableYearsFornecedores()
  const nome = anos
    .map(ano => loadFornecedores(ano).find(r => r.fornecedor_codigo === codigo)?.fornecedor_nome)
    .find(Boolean) ?? `Fornecedor ${codigo}`
  return {
    title: `${nome} — Fornecedores de Sorocaba`,
    description: `Movimentações financeiras de ${nome} (cód. ${codigo}) com a Prefeitura de Sorocaba. Dados do Livro de Conta-Corrente de Fornecedores.`,
    alternates: { canonical: `https://www.anatomiadogasto.ong.br/sorocaba/fornecedores/${codigo}` },
  }
}

export default async function FornecedorDetailPage({ params }: PageProps) {
  const { codigo } = await params

  if (!/^\d{5}$/.test(codigo)) notFound()

  const anos = getAvailableYearsFornecedores()

  const history = anos
    .map(ano => ({ ano, row: loadFornecedores(ano).find(r => r.fornecedor_codigo === codigo) ?? null }))
    .filter((e): e is { ano: number; row: FornecedorRow } => e.row !== null)

  if (history.length === 0) notFound()

  const latest   = history[0].row
  const cls      = latest.classificacao
  const totalDeb = history.reduce((s, e) => s + e.row.debito, 0)
  const firstYear = history[history.length - 1].ano
  const lastYear  = history[0].ano

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://www.anatomiadogasto.ong.br/" },
          { "@type": "ListItem", position: 2, name: "Fornecedores", item: "https://www.anatomiadogasto.ong.br/sorocaba/fornecedores" },
          { "@type": "ListItem", position: 3, name: latest.fornecedor_nome },
        ],
      }) }} />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba/fornecedores" className="nav-link" style={{ fontSize: "12px" }}>Fornecedores</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
              {latest.fornecedor_nome}
            </span>
          </div>
        </div>

        {/* Header */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-3" style={S.label}>
              Fornecedor · cód. {codigo} · Sorocaba/SP
            </p>
            <h1 className="font-light mb-6" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "800px" }}>
              {latest.fornecedor_nome}
            </h1>
            <div className="flex flex-wrap gap-8">
              <div>
                <p style={S.label} className="mb-1">Categoria</p>
                <p style={{ fontSize: "14px", color: CLASS_COLOR[cls] ?? "var(--text-03)", fontWeight: 600 }}>
                  {CLASS_LABEL[cls] ?? cls}
                </p>
              </div>
              <div>
                <p style={S.label} className="mb-1">Total recebido</p>
                <p style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(totalDeb)}
                  <span style={{ ...S.caption, marginLeft: "6px" }}>({firstYear}–{lastYear})</span>
                </p>
              </div>
              <div>
                <p style={S.label} className="mb-1">Exercícios disponíveis</p>
                <p style={{ fontSize: "14px", color: "var(--text-03)" }}>
                  {history.map(e => e.ano).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Histórico por exercício */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Movimentação por exercício</p>
            <div style={{ border: "1px solid var(--border-01)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left",  ...S.label, ...S.borderBottom }}>Exercício</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Recebido</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Crédito</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Movimentos</th>
                    <th style={{ padding: "10px 16px", textAlign: "left",  ...S.label, ...S.borderBottom }}>Período</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(({ ano, row }, i) => (
                    <tr key={ano} style={{ backgroundColor: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)" }}>
                      <td style={{ padding: "10px 16px", ...S.borderBottom, fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--text-01)" }}>
                        {ano}
                      </td>
                      <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-01)", fontWeight: 500 }}>
                        {fmt(row.debito)}
                      </td>
                      <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-03)" }}>
                        {fmt(row.credito)}
                      </td>
                      <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-03)" }}>
                        {row.movimentos.toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 16px", ...S.borderBottom, color: "var(--text-04)", whiteSpace: "nowrap" }}>
                        {row.primeira_data}–{row.ultima_data}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4" style={S.caption}>
              &ldquo;Recebido&rdquo; = débitos da conta da Prefeitura para este destinatário.
              Fonte: Livro de Conta-Corrente de Fornecedores · Portal de Transparência de Sorocaba.
            </p>
          </div>
        </section>

        {/* Navegação */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <div className="flex flex-wrap gap-6">
              <Link href="/sorocaba/fornecedores" className="nav-link" style={{ fontSize: "13px" }}>
                ← Todos os fornecedores
              </Link>
              <Link href="/sorocaba/dados" className="nav-link" style={{ fontSize: "13px" }}>
                Baixar dados completos
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
