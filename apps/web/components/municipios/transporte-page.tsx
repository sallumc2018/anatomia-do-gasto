import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TotalAnual, type TotalAnualPoint } from "@/components/charts/TotalAnual"
import { JsonLd } from "@/components/seo/json-ld"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import {
  formatMillions,
  formatPrecise,
  getAvailableYearsTransporte,
  loadTransporteDca,
  loadTransporteOrcamento,
  type TransporteOrcamentoRow,
} from "@/lib/data"

interface TransportePageConfigBase {
  dataMunicipio: string
  nome: string
  ibge: string
  structuredData: readonly unknown[]
  navLinks: readonly { href: string; label: string }[]
}

export type TransportePageConfig = TransportePageConfigBase & (
  | { variant: "dca" }
  | { variant: "rreo"; downloadMunicipio: string; contextText: string }
)

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2: { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function TransportePage({ config }: { config: TransportePageConfig }) {
  const years = getAvailableYearsTransporte(config.dataMunicipio)
  const latestYear = years[0]
  const latestOrcamento = latestYear ? loadTransporteOrcamento(latestYear, config.dataMunicipio) : null
  const latestDca = latestYear ? loadTransporteDca(latestYear, config.dataMunicipio) : null
  const yearRange = years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}` : years.length === 1 ? String(years[0]) : "—"
  const taxaExecucao = latestOrcamento && latestOrcamento.dotacao_atualizada > 0
    ? (latestOrcamento.empenhado / latestOrcamento.dotacao_atualizada) * 100
    : null
  const detailed = config.variant === "rreo"

  const serie: Array<TransporteOrcamentoRow & { ano: number }> = years
    .map((ano) => {
      const row = loadTransporteOrcamento(ano, config.dataMunicipio)
      return row ? { ...row, ano } : null
    })
    .filter((row): row is TransporteOrcamentoRow & { ano: number } => row !== null)
    .sort((a, b) => b.ano - a.ano)
  const atual = serie[0]
  const pctMunicipal = atual?.pct_orcamento ?? 0
  const chartData: TotalAnualPoint[] = [...years].reverse().map((year) => ({
    year: String(year),
    total: loadTransporteDca(year, config.dataMunicipio)?.liquidado ?? 0,
  }))
  const insights = detailed ? [
    ...(atual ? [
      `Em ${latestYear}, ${config.nome} liquidou ${fmt(atual.liquidado)} em transporte — ${pctMunicipal.toFixed(2)}% do orçamento municipal total.`,
      `O orçamento fixado (LOA) foi de ${fmt(atual.dotacao_inicial)} e o atualizado foi de ${fmt(atual.dotacao_atualizada)}.`,
    ] : []),
    ...(serie.length >= 2 ? (() => {
      const maisAntigo = serie[serie.length - 1]!
      if (!maisAntigo || maisAntigo.liquidado === 0) return []
      const variacao = ((atual!.liquidado - maisAntigo.liquidado) / maisAntigo.liquidado) * 100
      return [`Entre ${maisAntigo.ano} e ${latestYear}, o gasto com transporte ${variacao >= 0 ? "cresceu" : "caiu"} ${Math.abs(variacao).toFixed(1)}% em termos nominais.`]
    })() : []),
    "Transporte (função 26) inclui transporte coletivo urbano, obras viárias, manutenção da frota municipal e subsídios ao transporte público.",
  ] : []

  return (
    <div className="min-h-screen flex flex-col">
      {config.structuredData.map((data) => (
        <JsonLd key={JSON.stringify(data)} data={data} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className={detailed ? "mobile-hero-inset" : undefined} style={{ borderLeft: "4px solid var(--cyan-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Transporte · {config.nome}/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {detailed ? "" : "Série "}{yearRange}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                {detailed ? "Orçamento em transporte" : `Função Transporte em ${config.nome}`}
              </h1>
              {detailed ? (
                <>
                  {atual && (
                    <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                      Em {latestYear}, {config.nome} liquidou <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em transporte
                      — {pctMunicipal.toFixed(2)}% do orçamento municipal total. O orçamento fixado foi{" "}
                      <strong style={{ color: "var(--text-01)" }}>{fmt(atual.dotacao_inicial)}</strong>.
                    </p>
                  )}
                  <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                    Dados do RREO Anexo 02 — Demonstrativo da Execução das Despesas por Função/Subfunção. Função 26 — Transporte.
                    Inclui transporte coletivo urbano, obras viárias e infraestrutura de mobilidade.
                  </p>
                  <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 · 6º bimestre · IBGE {config.ibge}</p>
                </>
              ) : (
                <>
                  <p className="mb-6" style={{ ...S.body, fontSize: "16px", lineHeight: "26px", maxWidth: "620px" }}>
                    Orçamento anual da função Transporte (função 26) declarado ao Tesouro Nacional
                    via SICONFI — RREO Anexo 02 e DCA Anexo I-E.
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-04)", maxWidth: "640px" }}>
                    <strong style={{ color: "var(--text-03)" }}>Limitação:</strong> A função 26 agrupa
                    todas as subfunções de transporte — transporte público urbano, infraestrutura viária e demais.
                    Não é possível isolar cada modalidade a partir desta fonte.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {latestOrcamento && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              {!detailed && <p style={S.label} className="mb-6">Função 26 — Transporte · {latestYear} · RREO Anexo 02</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(detailed ? [
                  { label: `Dotação inicial ${latestYear}`, value: fmt(latestOrcamento.dotacao_inicial), note: "Orçamento aprovado na LOA" },
                  { label: "Dotação atualizada", value: fmt(latestOrcamento.dotacao_atualizada), note: "Após créditos e suplementações" },
                  { label: "Liquidado", value: fmt(latestOrcamento.liquidado), note: "Despesa efetivamente realizada" },
                  { label: "% do orçamento municipal", value: `${latestOrcamento.pct_orcamento.toFixed(2)}%`, note: "Do total empenhado pelo município" },
                ] : [
                  { label: "Dotação atualizada", value: formatMillions(latestOrcamento.dotacao_atualizada) },
                  { label: "Empenhado", value: formatMillions(latestOrcamento.empenhado) },
                  { label: "Taxa de execução", value: taxaExecucao !== null ? `${taxaExecucao.toFixed(1)}%` : "—", alert: taxaExecucao !== null && taxaExecucao > 95 },
                  { label: "% do orçamento municipal", value: `${latestOrcamento.pct_orcamento.toFixed(2)}%` },
                ]).map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className={detailed ? "font-light mt-2" : "font-light"} style={{ fontSize: "24px", color: "alert" in item && item.alert ? "var(--yellow-60, #b45309)" : "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>{item.value}</p>
                    {"note" in item && item.note && <p className="mt-1" style={S.caption}>{item.note}</p>}
                  </div>
                ))}
              </div>
              {!detailed && latestDca && <p className="mt-4" style={S.caption}>DCA — Pago: {formatPrecise(latestDca.pago)} · Liquidado: {formatPrecise(latestDca.liquidado)}</p>}
            </div>
          </section>
        )}

        {!detailed && chartData.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <h2 className="font-light mb-2" style={S.h2}>Evolução do gasto liquidado</h2>
              <p className="mb-6" style={S.caption}>Função 26 — Transporte · DCA Anexo I-E · {config.nome}/SP</p>
              <TotalAnual data={chartData} />
            </div>
          </section>
        )}

        {detailed ? (
          <section id="serie" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
                <div>
                  <p className="uppercase font-semibold mb-4" style={S.label}>Série histórica {yearRange}</p>
                  <h2 style={S.h2}>Execução orçamentária em transporte</h2>
                  <div style={S.borderTop}>
                    {serie.map((row) => (
                      <div key={row.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                        <span style={{ fontSize: "13px", color: row.ano === latestYear ? "var(--cyan-40)" : "var(--text-03)", fontWeight: row.ano === latestYear ? 600 : 400, minWidth: "40px" }}>{row.ano}</span>
                        <div><p style={S.caption}>Dotação</p><p className="font-mono" style={{ fontSize: "12px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>{fmt(row.dotacao_atualizada)}</p></div>
                        <div><p style={S.caption}>Liquidado</p><p className="font-mono" style={{ fontSize: "13px", color: row.ano === latestYear ? "var(--text-01)" : "var(--text-02)", fontWeight: row.ano === latestYear ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{fmt(row.liquidado)}</p></div>
                        <div><p style={S.caption}>% orçamento</p><p className="font-mono" style={{ fontSize: "12px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{row.pct_orcamento.toFixed(2)}%</p></div>
                      </div>
                    ))}
                  </div>
                  <DadoQueMostra items={insights} />
                </div>
                <div>
                  <p className="uppercase font-semibold mb-6" style={S.label}>O que é a função 26 — Transporte</p>
                  <p style={{ ...S.body, marginBottom: "12px" }}>
                    A função 26 no RREO representa os gastos municipais com transporte — transporte coletivo
                    urbano (ônibus, BRT), obras e manutenção viária, mobilidade ativa e infraestrutura.
                    {config.contextText}
                  </p>
                  <p style={{ ...S.body, marginBottom: "12px" }}>
                    O RREO Anexo 02 consolida a execução de despesas por função e subfunção. O valor de
                    referência é o liquidado acumulado até o 6º bimestre (encerramento do exercício).
                  </p>
                  <div className="p-4" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      <strong style={{ color: "var(--text-02)" }}>Nota metodológica:</strong>{" "}
                      O total da função 26 pode incluir subfunções diversas (transporte rodoviário, transporte
                      coletivo, obras viárias). Para detalhamento por subfunção, será necessário acesso ao
                      DCA — disponível em coletas futuras.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>Série histórica {yearRange}</p>
              <div style={S.borderTop}>
                {years.map((year) => {
                  const orc = loadTransporteOrcamento(year, config.dataMunicipio)
                  const dca = loadTransporteDca(year, config.dataMunicipio)
                  return (
                    <div key={year} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-6 py-4" style={S.borderBottom}>
                      <span className="font-mono font-semibold" style={{ fontSize: "15px", color: year === latestYear ? "var(--cyan-40)" : "var(--text-01)", minWidth: "40px" }}>{year}</span>
                      <div><p style={S.caption}>Dotação fixada</p><p className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{orc ? formatMillions(orc.dotacao_inicial) : "—"}</p></div>
                      <div><p style={S.caption}>Empenhado (RREO)</p><p className="font-mono" style={{ fontSize: "13px", color: year === latestYear ? "var(--text-01)" : "var(--text-02)", fontWeight: year === latestYear ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{orc ? formatMillions(orc.empenhado) : "—"}</p></div>
                      <div><p style={S.caption}>Liquidado (DCA)</p><p className="font-mono" style={{ fontSize: "13px", color: year === latestYear ? "var(--text-01)" : "var(--text-02)", fontWeight: year === latestYear ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{dca ? formatPrecise(dca.liquidado) : "—"}</p></div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4" style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 (6º bimestre) e DCA Anexo I-E. IBGE {config.ibge} = {config.nome}/SP.</p>
            </div>
          </section>
        )}

        {detailed && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
              <div className="flex flex-wrap gap-3">
                {years.map((ano) => <a key={ano} href={`/api/dados/${config.downloadMunicipio}/transporte/saida/rreo_transporte_${config.downloadMunicipio}_${ano}.csv`} className="nav-link" download>CSV {ano}</a>)}
              </div>
              <p className="mt-4" style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02. Função 26. IBGE {config.ibge}.</p>
            </div>
          </section>
        )}

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            {config.navLinks.map((link) => <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>)}
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
