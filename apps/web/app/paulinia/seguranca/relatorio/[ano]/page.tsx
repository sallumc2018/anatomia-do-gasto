import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsSegurancaOrcamento,
  loadSegurancaOrcamento,
} from "@/lib/data"

interface PageProps {
  params: Promise<{ ano: string }>
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
  h2: {
    fontSize: "28px",
    lineHeight: "36px",
    color: "var(--text-01)",
    fontWeight: 300,
  } as React.CSSProperties,
  small: {
    fontSize: "13px",
    lineHeight: "20px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmtDelta(current: number, prev: number | undefined): { text: string; up: boolean | null } {
  if (!prev || prev === 0) return { text: "—", up: null }
  const change = ((current - prev) / prev) * 100
  const sign = change >= 0 ? "+" : ""
  const arrow = change >= 0 ? "↑" : "↓"
  return { text: `${arrow} ${sign}${change.toFixed(1)}%`, up: change >= 0 }
}

export async function generateStaticParams() {
  const years = getAvailableYearsSegurancaOrcamento("paulinia")
  return years.map((year) => ({ ano: String(year) }))
}

export async function generateMetadata({ params }: { params: Promise<{ ano: string }> }): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Despesas em segurança pública — ${ano} | Paulínia`,
    description: `Execução orçamentária em segurança pública de Paulínia em ${ano}: dotação atualizada, empenhado, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.`,
    alternates: { canonical: `https://www.anatomiadogasto.ong.br/paulinia/seguranca/relatorio/${ano}` },
  }
}

export default async function RelatorioSegurancaPauliniaPage({ params }: PageProps) {
  const { ano } = await params
  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)

  const availableYears = getAvailableYearsSegurancaOrcamento("paulinia")
  if (!availableYears.includes(year)) notFound()

  const orcamento = loadSegurancaOrcamento(year, "paulinia")
  if (!orcamento) notFound()

  const prevYear = availableYears.find((y) => y < year) ?? null
  const prevOrcamento = prevYear ? loadSegurancaOrcamento(prevYear, "paulinia") : null

  const taxaExecucao = orcamento.dotacao_atualizada > 0
    ? (orcamento.empenhado / orcamento.dotacao_atualizada) * 100
    : null

  const deltaLiquidado = fmtDelta(orcamento.liquidado, prevOrcamento?.liquidado)
  const deltaEmpenhado = fmtDelta(orcamento.empenhado, prevOrcamento?.empenhado)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://www.anatomiadogasto.ong.br/" },
          { "@type": "ListItem", position: 2, name: "Segurança Pública", item: "https://www.anatomiadogasto.ong.br/paulinia/seguranca" },
          { "@type": "ListItem", position: 3, name: "Série histórica", item: "https://www.anatomiadogasto.ong.br/paulinia/seguranca/comparativo" },
          { "@type": "ListItem", position: 4, name: String(year) },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Execução orçamentária em segurança pública — Paulínia ${year}`,
        description: `Execução orçamentária em segurança pública de Paulínia em ${year}: dotação atualizada, empenhado, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.`,
        url: `https://www.anatomiadogasto.ong.br/paulinia/seguranca/relatorio/${year}`,
        temporalCoverage: String(year),
        license: "https://creativecommons.org/licenses/by/4.0/",
        publisher: { "@type": "Organization", name: "Anatomia do Gasto", url: "https://www.anatomiadogasto.ong.br" },
        spatialCoverage: { "@type": "Place", name: "Paulínia, São Paulo, Brasil" },
      }} />
      <main id="conteudo" className="flex-1">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/paulinia/seguranca" className="nav-link" style={{ fontSize: "12px" }}>Segurança</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/paulinia/seguranca/comparativo" className="nav-link" style={{ fontSize: "12px" }}>Série histórica</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>
                  Paulínia / SP · Segurança Pública · Exercício completo
                </p>
                <h1 className="font-light" style={{ fontSize: "clamp(24px, 3vw, 40px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Despesas em segurança pública — {year}
                </h1>
              </div>
              <div className="mobile-scroll flex items-center gap-3">
                {availableYears.map((y) => (
                  <Link key={y} href={`/paulinia/seguranca/relatorio/${y}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:      y === year ? "var(--text-01)" : "var(--text-04)",
                    border:     `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding:    "4px 10px",
                    textDecoration: "none",
                  }}>
                    {y}
                  </Link>
                ))}
                <a
                  href={`/api/dados/paulinia/seguranca/saida/rreo_seguranca_paulinia_${year}.csv`}
                  download
                  style={{ fontSize: "12px", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--purple-40)", textDecoration: "none", border: "1px solid var(--border-01)", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  ↓ CSV
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary bar ─────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>
              RREO Anexo 02 · Bimestre 6 · Exercício {year} · Paulínia/SP
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={S.borderTop}>
              {([
                { label: "Dotação inicial",     value: orcamento.dotacao_inicial },
                { label: "Dotação atualizada",  value: orcamento.dotacao_atualizada },
                { label: "Empenhado",           value: orcamento.empenhado },
                { label: "Liquidado",           value: orcamento.liquidado },
              ] as const).map((item, i) => (
                <div key={item.label} className="py-6" style={{
                  paddingRight: i < 3 ? "32px" : 0,
                  paddingLeft:  i > 0 ? "32px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-mono font-medium mb-1" style={{ fontSize: "clamp(18px, 2.5vw, 28px)", lineHeight: "1.1", color: "var(--text-01)" }}>
                    {formatMillions(item.value)}
                  </p>
                  <p className="font-mono mb-2" style={S.caption}>{formatPrecise(item.value)}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-03)" }}>{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6" style={{ border: "1px solid var(--border-01)" }}>
              <div className="px-4 py-3" style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-03)", textTransform: "uppercase" }}>
                  Execução e participação no orçamento municipal
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                {[
                  { label: "Taxa de execução",       value: taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—" },
                  { label: "% do orç. municipal",    value: orcamento.pct_orcamento > 0 ? `${orcamento.pct_orcamento.toFixed(2)}%` : "—" },
                  { label: `Δ Liquidado vs. ${prevYear ?? "—"}`, value: deltaLiquidado.text },
                  { label: `Δ Empenhado vs. ${prevYear ?? "—"}`, value: deltaEmpenhado.text },
                ].map((item, i) => (
                  <div key={item.label} className="px-4 py-4" style={{
                    borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                  }}>
                    <p className="font-mono font-semibold" style={{ fontSize: "16px", color: "var(--text-01)" }}>{item.value}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-04)", marginTop: "4px" }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  Valores EXCETO INTRA-ORÇAMENTÁRIAS — excluem transferências internas entre unidades.
                  Componente intra-orçamentário (auditoria): Empenhado {formatPrecise(orcamento.intra_empenhado)} ·
                  Liquidado {formatPrecise(orcamento.intra_liquidado)}.
                  {" "}Taxa = Empenhado EXCETO ÷ Dotação Atualizada.
                  % municipal = Segurança Pública liquidada ÷ total EXCETO municipal empenhado ({formatPrecise(orcamento.total_municipal_empenhado)}).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Nota de cobertura ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-6" style={S.container}>
            <div className="p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", borderLeft: "4px solid #f1c21b" }}>
              <p className="font-semibold mb-2" style={{ color: "var(--text-01)", fontSize: "13px" }}>
                Sem detalhamento por subfunção
              </p>
              <p style={{ ...S.small, color: "var(--text-03)" }}>
                Paulínia não publica o DCA Anexo I-E para segurança pública — por isso este relatório
                mostra apenas o total agregado da função 06, conforme o RREO Anexo 02. Não há
                distinção entre Policiamento, Defesa Civil ou Administração Geral nos dados disponíveis.
              </p>
            </div>
          </div>
        </section>

        {/* ── Fonte com URL rastreável ─────────────────────────────────────── */}
        {orcamento.fonte_url && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderTop, ...S.borderBottom }}>
            <div className="mx-auto px-6 py-10" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>
                Rastreabilidade · URL de origem declarada no dataset
              </p>
              <p className="mb-4" style={{ ...S.small, color: "var(--text-03)", maxWidth: "700px" }}>
                Este relatório foi gerado a partir da seguinte URL da API SICONFI.
                O link abre o JSON bruto original; os dados aqui exibidos são filtrados para a função 06 — Segurança Pública.
              </p>
              <a
                href={orcamento.fonte_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "13px", color: "var(--purple-40)", textDecoration: "none", wordBreak: "break-all" }}
              >
                {orcamento.fonte_url}
              </a>
            </div>
          </section>
        )}

        {/* ── O que estes dados mostram / não mostram ──────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={{ ...S.h2, fontSize: "22px" }}>
                  Volume e execução orçamentária
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Quanto foi fixado, atualizado, empenhado e liquidado em segurança pública no exercício.",
                    "A taxa de execução (empenhado ÷ dotação atualizada).",
                    "A participação percentual da segurança pública no orçamento municipal total.",
                    "A variação em relação ao exercício anterior.",
                    "A URL da API oficial de onde o dado foi extraído.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.small, color: "var(--text-02)" }}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
                <h2 className="font-light mb-6" style={{ ...S.h2, fontSize: "22px" }}>
                  Lacunas declaradas da fonte
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Distribuição por subfunção (Policiamento, Defesa Civil, Administração Geral, Informação e Inteligência).",
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, licitações ou processos individuais.",
                    "Efetivo em serviço, viaturas, ocorrências ou qualquer dado operacional.",
                    "Restos a pagar — o RREO Anexo 02 não detalha esse campo por função.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.small, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.caption, lineHeight: "18px" }}>
                  Diferente de Sorocaba, Paulínia não tem um DCA Anexo I-E disponível para segurança
                  pública — por isso este relatório usa apenas o RREO Anexo 02.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia/seguranca/comparativo" className="nav-link">← Série histórica</Link>
            <Link href="/paulinia/seguranca" className="nav-link">← Segurança pública</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
