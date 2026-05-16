import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsFiscal,
  loadNaturezaDespesa,
  loadRclCapital,
  type NaturezaDespesaRow,
  type RclCapitalRow,
} from "@/lib/data"

export const metadata: Metadata = {
  title: "Execução Orçamentária — Sorocaba",
  description:
    "Natureza da despesa e receitas de capital de Sorocaba 2020–2025. Pessoal, investimentos, operações de crédito e alienação de bens. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/execucao" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function pct(num: number, den: number): string {
  if (!den) return "—"
  return `${((num / den) * 100).toFixed(1)}%`
}

export default function ExecucaoPage() {
  const anos = getAvailableYearsFiscal()
  const anoAtual = anos[0] ?? 2025

  const naturezaSerie: NaturezaDespesaRow[] = anos
    .map((a) => loadNaturezaDespesa(a))
    .filter((r): r is NaturezaDespesaRow => r !== null)
    .sort((a, b) => a.ano - b.ano)

  const capitalSerie: RclCapitalRow[] = anos
    .map((a) => loadRclCapital(a))
    .filter((r): r is RclCapitalRow => r !== null)
    .sort((a, b) => a.ano - b.ano)

  const naturezaAtual = naturezaSerie.find((r) => r.ano === anoAtual)
  const capitalAtual  = capitalSerie.find((r)  => r.ano === anoAtual)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Execução Orçamentária · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Para onde vai o dinheiro e de onde vêm as receitas de capital
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                A natureza econômica da despesa revela o que o município prioriza: pessoal, custeio ou
                investimento. As receitas de capital mostram a capacidade de captar recursos para obras —
                por operações de crédito ou alienação de bens.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Dados extraídos do RREO Anexo 01 (6º bimestre) e do RGF Anexo 02 publicados no SICONFI
                pelo Tesouro Nacional.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {naturezaAtual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: `Total de despesas ${anoAtual}`,  valor: fmt(naturezaAtual.total_despesas),    nota: "Liquidadas até o 6º bimestre" },
                  { label: "Despesas correntes",             valor: fmt(naturezaAtual.despesas_correntes), nota: `${pct(naturezaAtual.despesas_correntes, naturezaAtual.total_despesas)} do total` },
                  { label: "Investimentos",                  valor: fmt(naturezaAtual.investimentos),      nota: `${pct(naturezaAtual.investimentos, naturezaAtual.total_despesas)} do total` },
                  { label: "Receitas de capital",            valor: capitalAtual ? fmt(capitalAtual.total_capital) : "—", nota: "Op. crédito + alienações + outras" },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "28px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Natureza da Despesa */}
        <section id="natureza" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Natureza da despesa 2020–{anoAtual}</p>
                <h2 style={S.h2}>Como as despesas se dividem por categoria econômica</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Pessoal e encargos são a maior fatia do orçamento municipal.
                  Investimentos (obras e equipamentos) dependem de folga fiscal e receitas de capital.
                  Em {anoAtual}, investimentos representaram{" "}
                  <strong style={{ color: "var(--text-01)" }}>
                    {naturezaAtual ? pct(naturezaAtual.investimentos, naturezaAtual.total_despesas) : "—"}
                  </strong>{" "}
                  do total de despesas liquidadas.
                </p>
                <div style={S.borderTop}>
                  {naturezaSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          invest. {pct(r.investimentos, r.total_despesas)}
                        </span>
                        <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "90px", textAlign: "right" }}>
                          {fmt(r.total_despesas)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4" style={S.caption}>
                  Fonte: RREO Anexo 01 · 6º bimestre · SICONFI/Tesouro Nacional · IBGE 3552205
                </p>
              </div>

              {/* Composição por categoria */}
              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>Composição das despesas por natureza — {anoAtual}</p>
                {naturezaAtual && (
                  <div style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", padding: "20px" }}>
                    {[
                      { label: "Pessoal e encargos",       valor: naturezaAtual.pessoal,            group: "corrente" },
                      { label: "Juros e encargos da dívida",valor: naturezaAtual.juros_encargos,    group: "corrente" },
                      { label: "Outras despesas correntes", valor: naturezaAtual.outras_correntes,  group: "corrente" },
                      { label: "Total correntes",           valor: naturezaAtual.despesas_correntes, group: "total-c"  },
                      { label: "Investimentos",             valor: naturezaAtual.investimentos,     group: "capital"  },
                      { label: "Total de capital",          valor: naturezaAtual.despesas_capital,  group: "total-k"  },
                    ].map((item) => {
                      const isTotal = item.group.startsWith("total")
                      return (
                        <div
                          key={item.label}
                          className="flex justify-between py-2"
                          style={{
                            borderTop: "1px solid var(--border-01)",
                            backgroundColor: isTotal ? "var(--bg-elevated)" : "transparent",
                            marginLeft:  (item.group === "corrente" || item.group === "capital") ? "0" : "0",
                            paddingLeft: isTotal ? "0" : "0",
                          }}
                        >
                          <span style={{ fontSize: "13px", color: isTotal ? "var(--text-01)" : "var(--text-03)", fontWeight: isTotal ? 600 : 400, paddingLeft: isTotal ? "0" : "8px" }}>
                            {item.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: "11px", color: "var(--text-04)" }}>
                              {pct(item.valor, naturezaAtual.total_despesas)}
                            </span>
                            <span className="font-mono" style={{ fontSize: "13px", color: isTotal ? "var(--text-01)" : "var(--text-02)", fontWeight: isTotal ? 600 : 400, minWidth: "90px", textAlign: "right" }}>
                              {fmt(item.valor)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid var(--border-02)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>Total de despesas</span>
                      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>{fmt(naturezaAtual.total_despesas)}</span>
                    </div>
                  </div>
                )}

                {/* Tabela série histórica completa */}
                <div className="mt-6 overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-02)" }}>
                        {["Ano", "Pessoal", "Juros", "Outras Corr.", "Investimentos", "Total"].map((h) => (
                          <th key={h} style={{ ...S.label, padding: "8px 8px", textAlign: h === "Ano" ? "left" : "right", fontWeight: 600 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {naturezaSerie.slice().reverse().map((r) => (
                        <tr key={r.ano} style={{
                          borderBottom: "1px solid var(--border-01)",
                          backgroundColor: r.ano === anoAtual ? "var(--bg-raised)" : "transparent",
                        }}>
                          <td style={{ padding: "10px 8px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                            {r.ano}
                          </td>
                          {[r.pessoal, r.juros_encargos, r.outras_correntes, r.investimentos, r.total_despesas].map((v, i) => (
                            <td key={i} className="font-mono" style={{ padding: "10px 8px", textAlign: "right", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                              {fmt(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Receitas de Capital */}
        <section id="receitas-capital" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Receitas de capital 2020–{anoAtual}</p>
                <h2 style={S.h2}>Operações de crédito e alienação de bens</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Receitas de capital financiam investimentos sem pressionar o caixa corrente.
                  Operações de crédito (empréstimos e financiamentos) são a principal fonte — externas
                  cresceram expressivamente desde 2021, reflexo de contratos com organismos internacionais
                  como BID e BIRD para projetos de infraestrutura urbana.
                </p>
                <div style={S.borderTop}>
                  {capitalSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          crédito ext. {pct(r.op_credito_externas, r.total_capital)}
                        </span>
                        <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "90px", textAlign: "right" }}>
                          {fmt(r.total_capital)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4" style={S.caption}>
                  Fonte: RREO Anexo 01 · 6º bimestre · SICONFI/Tesouro Nacional · IBGE 3552205
                </p>
              </div>

              {/* Composição receitas de capital */}
              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>Composição das receitas de capital — {anoAtual}</p>
                {capitalAtual && (
                  <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", padding: "20px" }}>
                    {[
                      { label: "Op. de crédito (total)",   valor: capitalAtual.op_credito_total    },
                      { label: "  — internas",             valor: capitalAtual.op_credito_internas  },
                      { label: "  — externas",             valor: capitalAtual.op_credito_externas  },
                      { label: "Alienação de bens",        valor: capitalAtual.alienacao_bens       },
                      { label: "Outras receitas de capital",valor: capitalAtual.outras_capital      },
                    ].map((item) => {
                      const isSub = item.label.startsWith("  ")
                      const isTotal = item.label === "Op. de crédito (total)"
                      return (
                        <div key={item.label} className="flex justify-between py-2" style={{ borderTop: "1px solid var(--border-01)" }}>
                          <span style={{ fontSize: "13px", color: isSub ? "var(--text-04)" : "var(--text-03)", fontWeight: isTotal ? 600 : 400, paddingLeft: isSub ? "16px" : "0" }}>
                            {item.label.trim()}
                          </span>
                          <div className="flex items-center gap-3">
                            {!isSub && (
                              <span style={{ fontSize: "11px", color: "var(--text-04)" }}>
                                {pct(item.valor, capitalAtual.total_capital)}
                              </span>
                            )}
                            <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontWeight: isTotal ? 600 : 400, minWidth: "90px", textAlign: "right" }}>
                              {fmt(item.valor)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid var(--border-02)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>Total de capital</span>
                      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>{fmt(capitalAtual.total_capital)}</span>
                    </div>
                  </div>
                )}

                {/* Série histórica receitas de capital */}
                <div className="mt-6 overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-02)" }}>
                        {["Ano", "Cred. Interno", "Cred. Externo", "Alienação", "Outras", "Total Capital"].map((h) => (
                          <th key={h} style={{ ...S.label, padding: "8px 8px", textAlign: h === "Ano" ? "left" : "right", fontWeight: 600 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {capitalSerie.slice().reverse().map((r) => (
                        <tr key={r.ano} style={{
                          borderBottom: "1px solid var(--border-01)",
                          backgroundColor: r.ano === anoAtual ? "var(--bg-raised)" : "transparent",
                        }}>
                          <td style={{ padding: "10px 8px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                            {r.ano}
                          </td>
                          {[r.op_credito_internas, r.op_credito_externas, r.alienacao_bens, r.outras_capital, r.total_capital].map((v, i) => (
                            <td key={i} className="font-mono" style={{ padding: "10px 8px", textAlign: "right", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                              {fmt(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Natureza econômica da despesa</p>
                <p style={S.body}>
                  A classificação por natureza mostra a finalidade econômica do gasto: despesas correntes
                  (pessoal, custeio, juros) são recorrentes; despesas de capital (investimentos, amortizações)
                  geram ativo ou reduzem passivo. A LRF exige equilíbrio entre receitas e despesas correntes.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Operações de crédito</p>
                <p style={S.body}>
                  Operações de crédito externas envolvem organismos internacionais (BID, BIRD, CAF) e
                  exigem aprovação do Senado Federal. Operações internas são contratadas com bancos
                  públicos nacionais (CEF, BNDES). Ambas integram a dívida consolidada e estão sujeitas
                  ao limite de 120% da RCL do Senado Federal.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Alienação de bens</p>
                <p style={S.body}>
                  A alienação de bens públicos (venda de imóveis, participações societárias) gera receita
                  de capital não recorrente. Pela LRF, o produto da alienação deve ser aplicado em
                  despesas de capital ou amortização de dívida — não pode financiar despesas correntes.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
