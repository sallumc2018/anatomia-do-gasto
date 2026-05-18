import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsFornecedores,
  loadFornecedores,
  type FornecedorRow,
} from "@/lib/data"

export const metadata: Metadata = {
  title: "Fornecedores — Sorocaba",
  description:
    "Quem recebeu dinheiro público de Sorocaba? Ranking de destinatários por débito acumulado, 2020–2025. Dados extraídos da conta-corrente de fornecedores publicada pelo Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/fornecedores" },
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "24px", lineHeight: "32px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return `R$ ${(v / 1e3).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mil`
}

const CLASS_LABEL: Record<string, string> = {
  folha:                       "Folha de pagamento",
  entidade_sem_fins_lucrativos: "Entidade sem fins lucrativos",
  empresa_privada:             "Empresa privada",
  fundo_publico:               "Fundo público",
  a_classificar:               "Não classificado",
}

const CLASS_COLOR: Record<string, string> = {
  folha:                       "var(--blue-40)",
  entidade_sem_fins_lucrativos: "var(--teal-40)",
  empresa_privada:             "var(--purple-40)",
  fundo_publico:               "var(--cyan-40)",
  a_classificar:               "var(--text-04)",
}

function classLabel(c: string): string {
  return CLASS_LABEL[c] ?? c
}

function classColor(c: string): string {
  return CLASS_COLOR[c] ?? "var(--text-04)"
}

export default function FornecedoresPage() {
  const anos = getAvailableYearsFornecedores()
  const anoAtual = anos[0] ?? 2025

  const rows: FornecedorRow[] = loadFornecedores(anoAtual)
    .sort((a, b) => b.debito - a.debito)

  const top50 = rows.slice(0, 50)
  const totalDebito = rows.reduce((s, r) => s + r.debito, 0)
  const totalFornecedores = rows.length

  // Breakdown by classification
  const byClass = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.classificacao] = (acc[r.classificacao] ?? 0) + r.debito
      return acc
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([cls, valor]) => ({ cls, valor, pct: totalDebito ? (valor / totalDebito) * 100 : 0 }))

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": "Fornecedores da Prefeitura de Sorocaba",
            "description": "Dados públicos de destinatários de recursos da Prefeitura de Sorocaba: empresas privadas, entidades sem fins lucrativos, folha de pagamento e fundos públicos. Fonte: Livro de Conta-Corrente de Fornecedores (Tesouro Nacional).",
            "url": "https://www.anatomiadogasto.ong.br/fornecedores",
            "creator": { "@type": "Organization", "name": "Anatomia do Gasto", "url": "https://www.anatomiadogasto.ong.br" },
            "spatialCoverage": { "@type": "Place", "name": "Sorocaba, São Paulo, Brasil" },
            "license": "https://creativecommons.org/licenses/by/4.0/",
          }),
        }}
      />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Fornecedores · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {anos.join(", ")}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Quem recebeu dinheiro público de Sorocaba
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Cada linha representa um destinatário registrado na conta-corrente de fornecedores —
                o total debitado equivale ao dinheiro efetivamente transferido. Movimentações internas
                da prefeitura foram excluídas. A classificação indica se o recebedor é folha de pessoal,
                empresa privada, entidade sem fins lucrativos ou fundo público.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)" }}>
                Dados extraídos do Livro de Conta-Corrente de Fornecedores publicado no Portal de
                Transparência de Sorocaba. Código IBGE: 3552205.
              </p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: `Total transferido ${anoAtual}`,  valor: fmt(totalDebito),          nota: "Débitos acumulados" },
                { label: "Destinatários",                   valor: totalFornecedores.toLocaleString("pt-BR"), nota: "Excl. movimentações internas" },
                { label: "Maior recebedor",                 valor: top50[0] ? fmt(top50[0].debito) : "—", nota: top50[0]?.fornecedor_nome ?? "" },
                { label: "Anos disponíveis",                valor: anos.length.toString(),    nota: anos.join(", ") },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "28px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {item.valor}
                  </p>
                  <p className="mt-1" style={{ ...S.caption, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
                    {item.nota}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por classificação + ranking */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 items-start">

              {/* Breakdown por categoria */}
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Distribuição por categoria — {anoAtual}</p>
                <h2 style={S.h2}>Para onde vai o dinheiro</h2>
                <p style={{ ...S.body, marginBottom: "20px" }}>
                  Folha de pagamento é a maior fatia do orçamento municipal. Empresas privadas concentram
                  contratos de custeio e obras. Entidades sem fins lucrativos recebem repasses em saúde e
                  assistência social.
                </p>
                <div style={S.borderTop}>
                  {byClass.map(({ cls, valor, pct }) => (
                    <div key={cls} style={{ ...S.borderBottom, padding: "12px 0" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: "13px", color: classColor(cls), fontWeight: 600 }}>
                          {classLabel(cls)}
                        </span>
                        <span style={{ fontSize: "13px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                          {fmt(valor)}
                        </span>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "var(--bg-base)", position: "relative" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: classColor(cls), opacity: 0.7 }} />
                      </div>
                      <p className="mt-1" style={{ ...S.caption, textAlign: "right" }}>
                        {pct.toFixed(1)}% do total
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4" style={S.caption}>
                  Fonte: Livro de Conta-Corrente de Fornecedores · Portal de Transparência de Sorocaba
                </p>
              </div>

              {/* Top 50 ranking */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="uppercase font-semibold" style={S.label}>Top 50 por débito acumulado — {anoAtual}</p>
                  {anos.length > 1 && (
                    <div className="flex gap-2">
                      {anos.map((a) => (
                        <a
                          key={a}
                          href={`/sorocaba/fornecedores?ano=${a}`}
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            border: "1px solid var(--border-02)",
                            color: a === anoAtual ? "var(--blue-40)" : "var(--text-04)",
                            textDecoration: "none",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {a}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ border: "1px solid var(--border-01)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-base)" }}>
                        <th style={{ padding: "10px 16px", textAlign: "left", ...S.label, borderBottom: "1px solid var(--border-01)", width: "36px" }}>#</th>
                        <th style={{ padding: "10px 16px", textAlign: "left", ...S.label, borderBottom: "1px solid var(--border-01)" }}>Destinatário</th>
                        <th style={{ padding: "10px 16px", textAlign: "left", ...S.label, borderBottom: "1px solid var(--border-01)" }}>Categoria</th>
                        <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, borderBottom: "1px solid var(--border-01)" }}>Débito</th>
                        <th style={{ padding: "10px 16px", textAlign: "right", ...S.label, borderBottom: "1px solid var(--border-01)" }}>Movimentos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top50.map((r, i) => (
                        <tr
                          key={r.fornecedor_codigo}
                          style={{ backgroundColor: i % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-base)" }}
                        >
                          <td style={{ padding: "10px 16px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums", borderBottom: "1px solid var(--border-01)" }}>
                            {i + 1}
                          </td>
                          <td style={{ padding: "10px 16px", color: "var(--text-01)", borderBottom: "1px solid var(--border-01)", maxWidth: "280px" }}>
                            <a href={`/sorocaba/fornecedores/${r.fornecedor_codigo}`} style={{ textDecoration: "none", color: "inherit" }}>
                              <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.fornecedor_nome}
                              </span>
                            </a>
                            <span style={{ fontSize: "11px", color: "var(--text-04)" }}>
                              cód. {r.fornecedor_codigo}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-01)" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: classColor(r.classificacao), letterSpacing: "0.04em" }}>
                              {classLabel(r.classificacao)}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-01)", fontWeight: 500, borderBottom: "1px solid var(--border-01)", whiteSpace: "nowrap" }}>
                            {fmt(r.debito)}
                          </td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-03)", borderBottom: "1px solid var(--border-01)" }}>
                            {r.movimentos.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3" style={S.caption}>
                  Movimentações internas da Prefeitura excluídas. &quot;Débito&quot; = dinheiro saído da conta da Prefeitura para este destinatário.
                  Dados referentes ao exercício {anoAtual}. Código IBGE 3552205.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nota metodológica */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div style={{ maxWidth: "720px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Limitações declaradas</p>
              <div className="flex flex-col gap-4" style={S.body}>
                <p>
                  <strong style={{ color: "var(--text-01)" }}>O que está aqui:</strong> dados de 2020,
                  2024 e 2025, extraídos do Livro de Conta-Corrente de Fornecedores. Cada linha agrega
                  todos os débitos do ano para aquele destinatário.
                </p>
                <p>
                  <strong style={{ color: "var(--text-01)" }}>O que falta:</strong> 2021, 2022 e 2023
                  ainda estão em extração (PDFs de grande volume). A classificação de alguns destinatários
                  está marcada como &ldquo;a_classificar&rdquo; — o código CNPJ/CPF não foi suficiente para
                  classificar automaticamente.
                </p>
                <p>
                  <strong style={{ color: "var(--text-01)" }}>O que este dado não é:</strong> não é a
                  nota de empenho, não é o contrato e não identifica o objeto do gasto. É o fluxo
                  financeiro agregado — quanto saiu da conta da Prefeitura para cada destinatário.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 mt-6">
                <a href="/sorocaba/dados" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Baixar dados completos
                </a>
                <a href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Ver metodologia
                </a>
                <a href="/sorocaba/executivo" style={{ fontSize: "13px", color: "var(--blue-40)", textDecoration: "underline" }}>
                  Orçamento por função
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
