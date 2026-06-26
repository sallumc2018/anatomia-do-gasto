import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import {
  getAvailableYearsSeguranca,
  getAvailableYearsTransporte,
  loadSegurancaOrcamento,
  type SegurancaOrcamentoRow,
} from "@/lib/data"

interface SegurancaPageConfigBase {
  dataMunicipio: string
  nome: string
  ibge: string
  structuredData: readonly unknown[]
  yearsSource: "seguranca" | "transporte"
  navLinks: readonly { href: string; label: string }[]
}

export type SegurancaPageConfig = SegurancaPageConfigBase & (
  | { variant: "totais"; downloadMunicipio?: never }
  | { variant: "detalhada"; downloadMunicipio: string }
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

export function SegurancaPage({ config }: { config: SegurancaPageConfig }) {
  const years = config.yearsSource === "transporte"
    ? getAvailableYearsTransporte(config.dataMunicipio)
    : getAvailableYearsSeguranca(config.dataMunicipio)
  const anoAtual = years[0] ?? 2025
  const serie: Array<SegurancaOrcamentoRow & { ano: number }> = years
    .map((ano) => {
      const row = loadSegurancaOrcamento(ano, config.dataMunicipio)
      return row ? { ...row, ano } : null
    })
    .filter((row): row is SegurancaOrcamentoRow & { ano: number } => row !== null)
    .sort((a, b) => b.ano - a.ano)
  const atual = serie[0]
  const yearRange = years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}` : String(anoAtual)
  const pctMunicipal = atual?.pct_orcamento ?? 0
  const detalhada = config.variant === "detalhada"

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, ${config.nome} destinou ${fmt(atual.liquidado)} à segurança pública — ${pctMunicipal.toFixed(2)}% do orçamento municipal total.`,
      `O orçamento fixado (LOA) foi de ${fmt(atual.dotacao_inicial)} e o atualizado foi de ${fmt(atual.dotacao_atualizada)}.`,
    ] : []),
    ...(serie.length >= 2 ? (() => {
      const maisAntigo = serie[serie.length - 1]!
      if (!maisAntigo || maisAntigo.liquidado === 0) return []
      const variacao = ((atual!.liquidado - maisAntigo.liquidado) / maisAntigo.liquidado) * 100
      return detalhada
        ? [`Entre ${maisAntigo.ano} e ${anoAtual}, o gasto com segurança ${variacao >= 0 ? "cresceu" : "caiu"} ${Math.abs(variacao).toFixed(1)}% em termos nominais.`]
        : [`Entre ${maisAntigo.ano} e ${anoAtual}, o gasto com segurança pública variou ${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}% — de ${fmt(maisAntigo.liquidado)} para ${fmt(atual!.liquidado)}.`]
    })() : []),
    ...(detalhada ? ["Segurança pública (função 06) no RREO inclui guarda municipal, defesa civil e policiamento. Polícia Civil e Militar são competência do Estado de SP."] : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {config.structuredData.map((data) => (
        <JsonLd key={JSON.stringify(data)} data={data} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--purple-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Segurança Pública · {config.nome}/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {detalhada ? "" : "Série "}{yearRange}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                {detalhada ? "Orçamento em segurança pública" : "Orçamento municipal em segurança pública"}
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, {config.nome} liquidou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em segurança pública —
                  {detalhada ? " " : <> equivalente a <strong style={{ color: "var(--text-01)" }}>{pctMunicipal.toFixed(2)}%</strong>{" "}</>}
                  {detalhada && `${pctMunicipal.toFixed(2)}% `}do orçamento municipal total.
                  {detalhada ? " O orçamento fixado foi " : " A dotação inicial foi de "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.dotacao_inicial)}</strong>.
                </p>
              )}
              {detalhada ? (
                <>
                  <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                    Dados do RREO Anexo 02 — Demonstrativo da Execução das Despesas por Função/Subfunção. Função 06 — Segurança Pública.
                    Inclui Guarda Municipal, Defesa Civil e ações afins de competência do município.
                  </p>
                  <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 · 6º bimestre · IBGE {config.ibge}</p>
                </>
              ) : (
                <>
                  <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "12px" }}>
                    Os dados são do RREO Anexo 02 — função Segurança Pública — extraídos do SICONFI pelo Tesouro Nacional.
                    Inclui Guarda Municipal e demais ações de segurança do município.
                  </p>
                  <div className="p-4 mt-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      <strong style={{ color: "var(--text-02)" }}>Nota de cobertura:</strong>{" "}
                      Para {config.nome}, o detalhamento por subfunção (Policiamento, Defesa Civil, Informação e Inteligência)
                      ainda não está disponível. A página exibe apenas os totais anuais da função Segurança Pública.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {(detalhada ? [
                  { label: `Dotação inicial ${anoAtual}`, valor: fmt(atual.dotacao_inicial), nota: "Orçamento aprovado na LOA" },
                  { label: "Dotação atualizada", valor: fmt(atual.dotacao_atualizada), nota: "Após créditos e suplementações" },
                  { label: "Liquidado", valor: fmt(atual.liquidado), nota: "Despesa efetivamente realizada" },
                  { label: "% do orçamento municipal", valor: `${pctMunicipal.toFixed(2)}%`, nota: "Do total empenhado pelo município" },
                ] : [
                  { label: `LOA fixada ${anoAtual}`, valor: fmt(atual.dotacao_inicial), nota: "Dotação inicial aprovada" },
                  { label: `LOA atualizada ${anoAtual}`, valor: fmt(atual.dotacao_atualizada), nota: "Com créditos adicionais" },
                  { label: `Liquidado ${anoAtual}`, valor: fmt(atual.liquidado), nota: "Despesa efetivamente reconhecida" },
                  { label: "% do orçamento municipal", valor: `${pctMunicipal.toFixed(2)}%`, nota: "Segurança ÷ total municipal" },
                ]).map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>{item.valor}</p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {detalhada ? (
          <section id="serie" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
                <div>
                  <p className="uppercase font-semibold mb-4" style={S.label}>Série histórica {yearRange}</p>
                  <h2 style={S.h2}>Execução orçamentária em segurança</h2>
                  <div style={S.borderTop}>
                    {serie.map((row) => (
                      <div key={row.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                        <span style={{ fontSize: "13px", color: row.ano === anoAtual ? "var(--purple-40)" : "var(--text-03)", fontWeight: row.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>{row.ano}</span>
                        <div><p style={S.caption}>Dotação</p><p className="font-mono" style={{ fontSize: "12px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>{fmt(row.dotacao_atualizada)}</p></div>
                        <div><p style={S.caption}>Liquidado</p><p className="font-mono" style={{ fontSize: "13px", color: row.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: row.ano === anoAtual ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{fmt(row.liquidado)}</p></div>
                        <div><p style={S.caption}>% orçamento</p><p className="font-mono" style={{ fontSize: "12px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{row.pct_orcamento.toFixed(2)}%</p></div>
                      </div>
                    ))}
                  </div>
                  <DadoQueMostra items={insights} />
                </div>
                <div>
                  <p className="uppercase font-semibold mb-6" style={S.label}>O que é a função 06 — Segurança Pública</p>
                  <p style={{ ...S.body, marginBottom: "12px" }}>
                    A função 06 no RREO representa os gastos municipais com segurança pública — principalmente
                    Guarda Municipal e Defesa Civil. Policiamento ostensivo e investigação criminal são
                    competência do Estado de São Paulo (PM e Polícia Civil) e não aparecem aqui.
                  </p>
                  <p style={{ ...S.body, marginBottom: "12px" }}>
                    O RREO Anexo 02 consolida a execução de despesas por função e subfunção. O valor de
                    referência é o liquidado acumulado até o 6º bimestre (encerramento do exercício).
                  </p>
                  <div className="p-4" style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px" }}>
                      <strong style={{ color: "var(--text-02)" }}>Nota metodológica:</strong>{" "}
                      Em alguns anos pode haver componente intra-orçamentário (contribuições ao RPPS de servidores
                      da segurança). O campo &quot;empenhado&quot; nesta página refere-se ao componente
                      EXCETO INTRA-ORÇAMENTÁRIAS para comparabilidade entre anos.
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
              <h2 style={{ ...S.h2, fontSize: "20px" }}>Evolução do gasto em segurança pública</h2>
              <div style={S.borderTop}>
                {serie.map((row) => {
                  const isLatest = row.ano === anoAtual
                  const pctExec = row.dotacao_atualizada > 0 ? (row.liquidado / row.dotacao_atualizada * 100).toFixed(1) : "—"
                  return (
                    <div key={row.ano} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-6 py-4" style={S.borderBottom}>
                      <span className="font-mono font-semibold" style={{ fontSize: "15px", color: isLatest ? "var(--purple-40)" : "var(--text-01)", minWidth: "40px" }}>{row.ano}</span>
                      <div><p style={S.caption}>Fixado</p><p className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(row.dotacao_inicial)}</p></div>
                      <div><p style={S.caption}>Liquidado</p><p className="font-mono" style={{ fontSize: "13px", color: isLatest ? "var(--text-01)" : "var(--text-02)", fontWeight: isLatest ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{fmt(row.liquidado)}</p></div>
                      <div><p style={S.caption}>% executado</p><p className="font-mono" style={{ fontSize: "13px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{pctExec}%</p></div>
                      <div><p style={S.caption}>% municipal</p><p className="font-mono" style={{ fontSize: "13px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{row.pct_orcamento.toFixed(2)}%</p></div>
                    </div>
                  )
                })}
              </div>
              <DadoQueMostra items={insights} />
            </div>
          </section>
        )}

        {detalhada ? (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
              <div className="flex flex-wrap gap-3">
                {years.map((ano) => (
                  <a key={ano} href={`/api/dados/${config.downloadMunicipio}/seguranca/saida/rreo_seguranca_${config.downloadMunicipio}_${ano}.csv`} className="nav-link" download>
                    CSV {ano}
                  </a>
                ))}
              </div>
              <p className="mt-4" style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02. Função 06. IBGE {config.ibge}.</p>
            </div>
          </section>
        ) : (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="uppercase font-semibold mb-3" style={S.label}>O que é a função Segurança Pública</p>
                  <p style={S.body}>
                    No orçamento municipal, a função Segurança Pública (código 06) abrange as despesas com a
                    Guarda Municipal e demais ações de segurança urbana. Os dados vêm do RREO Anexo 02,
                    que consolida o orçamento por função orçamentária (Portaria SOF 42/1999).
                  </p>
                </div>
                <div>
                  <p className="uppercase font-semibold mb-3" style={S.label}>Fonte dos dados</p>
                  <p style={S.body}>
                    SICONFI/Tesouro Nacional — RREO Anexo 02 (Demonstrativo da Execução das Despesas por Função),
                    6º bimestre de cada exercício. IBGE {config.ibge} = {config.nome}/SP.
                  </p>
                </div>
              </div>
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
