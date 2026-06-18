import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  getAvailableYearsSeguranca,
  loadSegurancaOrcamento,
  type SegurancaOrcamentoRow,
} from "@/lib/data"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"

const MUNICIPIO = "sao_paulo"

export const metadata: Metadata = {
  title: "Segurança Pública em São Paulo",
  description: "Execução orçamentária de segurança pública em São Paulo 2020–2025: dotação, liquidado e percentual do orçamento municipal. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/seguranca" },
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
    marginBottom: "12px",
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default function SaoPauloSegurancaPage() {
  const years = getAvailableYearsSeguranca(MUNICIPIO)
  const anoAtual = years[0] ?? 2025

  const serie: Array<SegurancaOrcamentoRow & { ano: number }> = years
    .map((ano) => {
      const row = loadSegurancaOrcamento(ano, MUNICIPIO)
      return row ? { ...row, ano } : null
    })
    .filter((r): r is SegurancaOrcamentoRow & { ano: number } => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const atual = serie[0]
  const yearRange = years.length > 1 ? `${Math.min(...years)}–${Math.max(...years)}` : String(anoAtual)

  const pctMunicipal = atual?.pct_orcamento ?? 0

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, São Paulo destinou ${fmt(atual.liquidado)} à segurança pública — ${pctMunicipal.toFixed(2)}% do orçamento municipal total.`,
      `O orçamento fixado (LOA) foi de ${fmt(atual.dotacao_inicial)} e o atualizado foi de ${fmt(atual.dotacao_atualizada)}.`,
    ] : []),
    ...(serie.length >= 2 ? (() => {
      const mais_antigo = serie[serie.length - 1]!
      if (!mais_antigo || mais_antigo.liquidado === 0) return []
      const variacao = ((atual!.liquidado - mais_antigo.liquidado) / mais_antigo.liquidado) * 100
      return [`Entre ${mais_antigo.ano} e ${anoAtual}, o gasto com segurança pública variou ${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}% — de ${fmt(mais_antigo.liquidado)} para ${fmt(atual!.liquidado)}.`]
    })() : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--purple-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Segurança Pública · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série {yearRange}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Orçamento municipal em segurança pública
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, São Paulo liquidou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em segurança pública —
                  equivalente a{" "}
                  <strong style={{ color: "var(--text-01)" }}>{pctMunicipal.toFixed(2)}%</strong> do orçamento municipal total.
                  A dotação inicial foi de{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.dotacao_inicial)}</strong>.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "12px" }}>
                Os dados são do RREO Anexo 02 — função Segurança Pública — extraídos do SICONFI pelo Tesouro Nacional.
                Inclui Guarda Municipal e demais ações de segurança do município.
              </p>
              <div className="p-4 mt-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota de cobertura:</strong>{" "}
                  Para São Paulo, o detalhamento por subfunção (Policiamento, Defesa Civil, Informação e Inteligência)
                  ainda não está disponível. A página exibe apenas os totais anuais da função Segurança Pública.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        {atual && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: `LOA fixada ${anoAtual}`,     valor: fmt(atual.dotacao_inicial),   nota: "Dotação inicial aprovada" },
                  { label: `LOA atualizada ${anoAtual}`,  valor: fmt(atual.dotacao_atualizada), nota: "Com créditos adicionais" },
                  { label: `Liquidado ${anoAtual}`,       valor: fmt(atual.liquidado),          nota: "Despesa efetivamente reconhecida" },
                  { label: "% do orçamento municipal",    valor: `${pctMunicipal.toFixed(2)}%`, nota: "Segurança ÷ total municipal" },
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
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Série histórica {yearRange}</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>Evolução do gasto em segurança pública</h2>
            <div style={S.borderTop}>
              {serie.map((r) => {
                const isLatest = r.ano === anoAtual
                const pctExec = r.dotacao_atualizada > 0 ? (r.liquidado / r.dotacao_atualizada * 100).toFixed(1) : "—"
                return (
                  <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-6 py-4" style={S.borderBottom}>
                    <span className="font-mono font-semibold" style={{ fontSize: "15px", color: isLatest ? "var(--purple-40)" : "var(--text-01)", minWidth: "40px" }}>
                      {r.ano}
                    </span>
                    <div>
                      <p style={S.caption}>Fixado</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.dotacao_inicial)}</p>
                    </div>
                    <div>
                      <p style={S.caption}>Liquidado</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: isLatest ? "var(--text-01)" : "var(--text-02)", fontWeight: isLatest ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                        {fmt(r.liquidado)}
                      </p>
                    </div>
                    <div>
                      <p style={S.caption}>% executado</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{pctExec}%</p>
                    </div>
                    <div>
                      <p style={S.caption}>% municipal</p>
                      <p className="font-mono" style={{ fontSize: "13px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{r.pct_orcamento.toFixed(2)}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <DadoQueMostra items={insights} />
          </div>
        </section>

        {/* Contexto */}
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
                  6º bimestre de cada exercício. IBGE 3550308 = São Paulo/SP.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/transporte" className="nav-link">Transporte</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
