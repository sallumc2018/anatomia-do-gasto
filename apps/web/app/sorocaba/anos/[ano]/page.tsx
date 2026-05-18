import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsExecutivo,
  loadExecutivoData,
  getAvailableYears,
  getAvailableYearsSeguranca,
  getAvailableYearsTransporte,
  type ExecutivoRow,
} from "@/lib/data"

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "20px", lineHeight: "28px", color: "var(--text-01)", fontWeight: 300 } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmtMi(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mi`
}

function pct(part: number, total: number): string {
  if (!total) return "—"
  return `${((part / total) * 100).toFixed(1)}%`
}

// Funções de destaque por área (primeiros 2 dígitos do código da função)
const AREA_FUNCOES: Record<string, { label: string; cor: string; slug: string; prefixo: string }> = {
  saude:     { label: "Saúde",            cor: "var(--teal-40)",   slug: "saude",     prefixo: "10" },
  educacao:  { label: "Educação",         cor: "var(--blue-40)",   slug: "educacao",  prefixo: "12" },
  seguranca: { label: "Segurança Pública",cor: "var(--purple-40)", slug: "seguranca", prefixo: "06" },
  transporte:{ label: "Transporte",       cor: "var(--cyan-40)",   slug: "transporte",prefixo: "26" },
}

interface PageProps {
  params: Promise<{ ano: string }>
}

export async function generateStaticParams() {
  return getAvailableYearsExecutivo().map((year) => ({ ano: String(year) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Sorocaba em ${ano} — execução orçamentária`,
    description: `Resumo da execução orçamentária de Sorocaba em ${ano}: total empenhado, liquidado e pago por função. Dados do SICONFI/Tesouro Nacional.`,
    alternates: { canonical: `https://www.anatomiadogasto.ong.br/sorocaba/anos/${ano}` },
  }
}

export default async function AnoPage({ params }: PageProps) {
  const { ano } = await params

  if (!/^\d{4}$/.test(ano)) notFound()
  const year = Number(ano)

  const availableYears = getAvailableYearsExecutivo()
  if (!availableYears.includes(year)) notFound()

  const rows: ExecutivoRow[] = loadExecutivoData(year)
  if (rows.length === 0) notFound()

  const totalEmp = rows.reduce((s, r) => s + r.empenhado, 0)
  const totalLiq = rows.reduce((s, r) => s + r.exceto_intra_liquidado, 0)
  const totalDot = rows.reduce((s, r) => s + r.dotacao_atualizada, 0)

  // Totais por área (match by funcao prefix)
  const areaRow = (prefixo: string) =>
    rows.filter((r) => r.funcao.startsWith(prefixo))
        .reduce((s, r) => ({ emp: s.emp + r.empenhado, liq: s.liq + r.exceto_intra_liquidado }), { emp: 0, liq: 0 })

  // Anos disponíveis por área (para links condicionais)
  const anosSaude      = getAvailableYears("saude")
  const anosEducacao   = getAvailableYears("educacao")
  const anosSeguranca  = getAvailableYearsSeguranca()
  const anosTransporte = getAvailableYearsTransporte()
  const anosDisponiveis: Record<string, number[]> = {
    saude: anosSaude, educacao: anosEducacao, seguranca: anosSeguranca, transporte: anosTransporte,
  }

  const prevYear = availableYears.find((y) => y < year) ?? null
  const nextYear = availableYears.find((y) => y > year) ?? null

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: "https://www.anatomiadogasto.ong.br/" },
          { "@type": "ListItem", position: 2, name: "Sorocaba", item: "https://www.anatomiadogasto.ong.br/sorocaba" },
          { "@type": "ListItem", position: 3, name: String(year) },
        ],
      }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Execução orçamentária de Sorocaba — ${year}`,
        description: `Total das despesas municipais de Sorocaba em ${year} por função orçamentária: dotação, empenho, liquidação e pagamento. Fonte: SICONFI/Tesouro Nacional.`,
        url: `https://www.anatomiadogasto.ong.br/sorocaba/anos/${year}`,
        temporalCoverage: String(year),
        license: "https://creativecommons.org/licenses/by/4.0/",
        publisher: { "@type": "Organization", name: "Anatomia do Gasto", url: "https://www.anatomiadogasto.ong.br" },
        spatialCoverage: { "@type": "Place", name: "Sorocaba, São Paulo, Brasil" },
      }) }} />
      <main id="conteudo" className="flex-1">

        {/* Breadcrumb */}
        <div style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-3 flex items-center gap-2" style={{ ...S.container, flexWrap: "wrap" }}>
            <Link href="/" className="nav-link" style={{ fontSize: "12px" }}>Início</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <Link href="/sorocaba" className="nav-link" style={{ fontSize: "12px" }}>Sorocaba</Link>
            <span style={{ fontSize: "12px", color: "var(--text-04)" }}>/</span>
            <span style={{ fontSize: "12px", color: "var(--text-01)" }}>{year}</span>
          </div>
        </div>

        {/* Header */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>
                  Orçamento Municipal · Sorocaba/SP
                </p>
                <h1 className="font-light" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}>
                  Sorocaba em {year}
                </h1>
              </div>
              {/* Navegação entre anos */}
              <div className="mobile-scroll flex items-center gap-2">
                {availableYears.map((y) => (
                  <Link key={y} href={`/sorocaba/anos/${y}`} style={{
                    fontSize: "13px",
                    fontFamily: "var(--font-ibm-plex-mono)",
                    color:   y === year ? "var(--text-01)" : "var(--text-04)",
                    border:  `1px solid ${y === year ? "var(--border-02)" : "var(--border-01)"}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                  }}>
                    {y}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* KPIs totais */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Dotação atualizada", valor: fmtMi(totalDot), nota: "Orçamento autorizado" },
                { label: "Empenhado",          valor: fmtMi(totalEmp), nota: `${pct(totalEmp, totalDot)} do orçamento` },
                { label: "Liquidado",          valor: fmtMi(totalLiq), nota: `${pct(totalLiq, totalDot)} do orçamento` },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "32px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {item.valor}
                  </p>
                  <p className="mt-1" style={S.caption}>{item.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cards por área */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Áreas com relatório detalhado</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(AREA_FUNCOES).map(([slug, info]) => {
                const { emp, liq } = areaRow(info.prefixo)
                const temRelatorio = anosDisponiveis[slug]?.includes(year)
                return (
                  <div key={slug} style={{ border: "1px solid var(--border-01)", padding: "20px", backgroundColor: "var(--bg-base)" }}>
                    <div style={{ width: "3px", height: "24px", backgroundColor: info.cor, marginBottom: "12px" }} />
                    <p style={{ ...S.label, color: info.cor, marginBottom: "8px" }}>{info.label}</p>
                    <p className="font-light mb-1" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                      {emp > 0 ? fmtMi(emp) : "—"}
                    </p>
                    <p style={S.caption} className="mb-4">
                      {emp > 0 ? `${pct(emp, totalEmp)} do total · liq. ${fmtMi(liq)}` : "Sem dados disponíveis"}
                    </p>
                    {temRelatorio ? (
                      <Link href={`/sorocaba/${info.slug}/relatorio/${year}`} className="nav-link" style={{ fontSize: "12px" }}>
                        Ver relatório {year} →
                      </Link>
                    ) : (
                      <Link href={`/sorocaba/${info.slug}`} className="nav-link" style={{ fontSize: "12px" }}>
                        Ver área →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Tabela completa por função */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>
              Execução por função orçamentária — {year}
            </p>
            <div style={{ border: "1px solid var(--border-01)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left",  ...S.label, ...S.borderBottom }}>Função</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Dotação atualizada</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Empenhado</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>Liquidado</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, ...S.borderBottom }}>% total liq.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .sort((a, b) => b.exceto_intra_liquidado - a.exceto_intra_liquidado)
                    .map((r, i) => (
                      <tr key={r.funcao} style={{ backgroundColor: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-elevated)" }}>
                        <td style={{ padding: "10px 16px", ...S.borderBottom, color: "var(--text-01)" }}>
                          {r.funcao}
                        </td>
                        <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-03)" }}>
                          {fmtMi(r.dotacao_atualizada)}
                        </td>
                        <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-02)" }}>
                          {fmtMi(r.empenhado)}
                        </td>
                        <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-01)", fontWeight: 500 }}>
                          {fmtMi(r.exceto_intra_liquidado)}
                        </td>
                        <td style={{ padding: "10px 16px", ...S.borderBottom, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-04)" }}>
                          {pct(r.exceto_intra_liquidado, totalLiq)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SICONFI/Tesouro Nacional · DCA Anexo I-D · 6º bimestre · Exceto intra-orçamentárias.
              Código IBGE 3552205.
            </p>
          </div>
        </section>

        {/* Navegação entre anos */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-8" style={S.container}>
            <div className="flex flex-wrap items-center gap-6">
              {prevYear && (
                <Link href={`/sorocaba/anos/${prevYear}`} className="nav-link" style={{ fontSize: "13px" }}>
                  ← {prevYear}
                </Link>
              )}
              {nextYear && (
                <Link href={`/sorocaba/anos/${nextYear}`} className="nav-link" style={{ fontSize: "13px" }}>
                  {nextYear} →
                </Link>
              )}
              <Link href="/sorocaba/executivo" className="nav-link" style={{ fontSize: "13px" }}>
                Visão executiva completa
              </Link>
              <Link href="/sorocaba" className="nav-link" style={{ fontSize: "13px" }}>
                Painel Sorocaba
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
