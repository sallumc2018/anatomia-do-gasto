import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsTransporte,
  loadTransporteOrcamento,
  type TransporteOrcamentoRow,
} from "@/lib/data"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"

const MUNICIPIO = "sao_bernardo"

export const metadata: Metadata = {
  title: "Transporte em São Bernardo do Campo",
  description: "Execução orçamentária de transporte em São Bernardo do Campo 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-bernardo/transporte" },
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

export default function SaoBernardoTransportePage() {
  const years = getAvailableYearsTransporte(MUNICIPIO)
  const anoAtual = years[0] ?? 2025

  const serie: Array<TransporteOrcamentoRow & { ano: number }> = years
    .map((ano) => {
      const row = loadTransporteOrcamento(ano, MUNICIPIO)
      return row ? { ...row, ano } : null
    })
    .filter((r): r is TransporteOrcamentoRow & { ano: number } => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const atual = serie[0]
  const yearRange = years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}` : String(anoAtual)

  const pctMunicipal = atual?.pct_orcamento ?? 0

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, São Bernardo do Campo liquidou ${fmt(atual.liquidado)} em transporte — ${pctMunicipal.toFixed(2)}% do orçamento municipal total.`,
      `O orçamento fixado (LOA) foi de ${fmt(atual.dotacao_inicial)} e o atualizado foi de ${fmt(atual.dotacao_atualizada)}.`,
    ] : []),
    ...(serie.length >= 2 ? (() => {
      const mais_antigo = serie[serie.length - 1]!
      if (!mais_antigo || mais_antigo.liquidado === 0) return []
      const variacao = ((atual!.liquidado - mais_antigo.liquidado) / mais_antigo.liquidado) * 100
      return [`Entre ${mais_antigo.ano} e ${anoAtual}, o gasto com transporte ${variacao >= 0 ? "cresceu" : "caiu"} ${Math.abs(variacao).toFixed(1)}% em termos nominais.`]
    })() : []),
    "Transporte (função 26) inclui transporte coletivo urbano, obras viárias, manutenção da frota municipal e subsídios ao transporte público.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--cyan-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Transporte · São Bernardo do Campo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  {yearRange}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Orçamento em transporte
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, São Bernardo do Campo liquidou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em transporte
                  — {pctMunicipal.toFixed(2)}% do orçamento municipal total. O orçamento fixado foi{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.dotacao_inicial)}</strong>.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados do RREO Anexo 02 — Demonstrativo da Execução das Despesas por Função/Subfunção. Função 26 — Transporte.
                Inclui transporte coletivo urbano, obras viárias e infraestrutura de mobilidade.
              </p>
              <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 · 6º bimestre · IBGE 3548708</p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: `Dotação inicial ${anoAtual}`,   valor: fmt(atual.dotacao_inicial),    nota: "Orçamento aprovado na LOA" },
                  { label: "Dotação atualizada",             valor: fmt(atual.dotacao_atualizada), nota: "Após créditos e suplementações" },
                  { label: "Liquidado",                      valor: fmt(atual.liquidado),           nota: "Despesa efetivamente realizada" },
                  { label: "% do orçamento municipal",       valor: `${pctMunicipal.toFixed(2)}%`,  nota: "Do total empenhado pelo município" },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "24px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                      {item.valor}
                    </p>
                    <p className="mt-1" style={S.caption}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Série histórica */}
        <section id="serie" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Série histórica {yearRange}</p>
                <h2 style={S.h2}>Execução orçamentária em transporte</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--cyan-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>Dotação</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.dotacao_atualizada)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Liquidado</p>
                        <p className="font-mono" style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(r.liquidado)}
                        </p>
                      </div>
                      <div>
                        <p style={S.caption}>% orçamento</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{r.pct_orcamento.toFixed(2)}%</p>
                      </div>
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
                  São Bernardo é um município de grandes distâncias e histórico industrial, com demanda
                  expressiva de transporte público e rodovias municipais.
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

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <div className="flex flex-wrap gap-3">
              {years.map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_bernardo/transporte/saida/rreo_transporte_sao_bernardo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02. Função 26. IBGE 3548708.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-bernardo" className="nav-link">← São Bernardo</Link>
            <Link href="/sao-bernardo/seguranca" className="nav-link">Segurança</Link>
            <Link href="/sao-bernardo/receita" className="nav-link">Receitas</Link>
            <Link href="/sao-bernardo/saude-fiscal" className="nav-link">Saúde fiscal</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
