import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"
import { getAvailableYearsExecutivo, loadExecutivoData } from "@/lib/data"

export const metadata: Metadata = {
  title: "Educação em São Paulo",
  description:
    "Gasto municipal em educação de São Paulo 2015–2026: dotação aprovada, liquidado e participação no orçamento total. Fonte: RREO Anexo 02 / SICONFI — Tesouro Nacional.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/educacao` },
}

const MUNICIPIO = "sao_paulo"

interface EducAnual {
  ano: number
  dotacao: number
  empenhado: number
  liquidado: number
  totalMun: number
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

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function loadEducAnual(ano: number): EducAnual | null {
  const rows = loadExecutivoData(ano, MUNICIPIO)
  if (!rows.length) return null

  const educ = rows.find((r) => {
    const f = r.funcao.trim().toLowerCase()
    return f === "educação" || f === "educacao"
  })
  const total = rows.find((r) => r.funcao.trim().toUpperCase().startsWith("TOTAL"))
  if (!educ) return null

  return {
    ano,
    dotacao: educ.dotacao_inicial,
    empenhado: educ.empenhado,
    liquidado: educ.liquidado,
    totalMun: total?.liquidado ?? 0,
  }
}

const jsonLd = [
  datasetSchema({
    name: "Despesas em educação — São Paulo",
    description:
      "Execução orçamentária em educação (função 12) do Município de São Paulo: dotação inicial, empenhado e liquidado. Fonte: RREO Anexo 02 / SICONFI. IBGE 3550308.",
    url: `${SITE_URL}/sao-paulo/educacao`,
    temporalCoverage: "2015/2026",
    spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
    keywords: ["educação", "São Paulo", "SICONFI", "MDE", "FUNDEB", "orçamento"],
    dateModified: "2026-07-09",
    downloadUrls: getAvailableYearsExecutivo(MUNICIPIO).map(
      (ano) =>
        `${SITE_URL}/api/dados/sao_paulo/executivo/saida/despesas_executivo_sao_paulo_${ano}.csv`,
    ),
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
    { name: "Educação" },
  ]),
]

export default function SaoPauloEducacaoPage() {
  const anosDisponiveis = getAvailableYearsExecutivo(MUNICIPIO)
  const serie: EducAnual[] = anosDisponiveis
    .map(loadEducAnual)
    .filter((r): r is EducAnual => r !== null)
    .sort((a, b) => b.ano - a.ano)

  const atual = serie[0]
  const anoAtual = atual?.ano ?? 2025
  const base2015 = serie.find((s) => s.ano === 2015)

  const growth = base2015 && atual && base2015.liquidado > 0
    ? ((atual.liquidado - base2015.liquidado) / base2015.liquidado * 100)
    : null

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChart: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: s.dotacao,
    liquidado: s.liquidado,
  }))

  const pctAtual = atual && atual.totalMun > 0
    ? (atual.liquidado / atual.totalMun * 100)
    : null

  const insights: string[] = [
    ...(atual ? [
      `Em ${anoAtual}, São Paulo liquidou ${fmt(atual.liquidado)} em educação${pctAtual ? ` — ${pctAtual.toFixed(1)}% do orçamento municipal total.` : "."}`,
    ] : []),
    ...(growth !== null && base2015 ? [
      `Entre 2015 e ${anoAtual}, o gasto liquidado em educação variou ${growth >= 0 ? "+" : ""}${growth.toFixed(0)}% em termos nominais — de ${fmt(base2015.liquidado)} para ${fmt(atual!.liquidado)}.`,
    ] : []),
    "São Paulo é a maior prefeitura do país em orçamento absoluto; educação é historicamente uma das maiores funções de gasto do município, ao lado de saúde e previdência.",
    "Os valores mais recentes (bimestre 2 de 2026) são parciais — o exercício ainda não fechou. Anos anteriores (bimestre 6) representam o fechamento do exercício.",
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--green-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Educação · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  2015–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Gasto municipal em educação — São Paulo
              </h1>
              {atual && (
                <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                  Em {anoAtual}, o Município de São Paulo liquidou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(atual.liquidado)}</strong> em educação
                  {pctAtual && ` — ${pctAtual.toFixed(1)}% do orçamento municipal total`}.
                  A dotação inicial aprovada em LOA foi de {fmt(atual.dotacao)}.
                </p>
              )}
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados extraídos do RREO Anexo 02 (função Educação) via SICONFI/Tesouro Nacional.
                Cobrem o orçamento executado pelo Executivo municipal; a Câmara Municipal tem orçamento separado.
              </p>
              <div className="p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)", maxWidth: "640px" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota metodológica:</strong>{" "}
                  Esta página mostra a execução orçamentária da função Educação (RREO Anexo 02).
                  O cumprimento do mínimo constitucional de MDE (25%) via SICONFI (RREO Anexo 14)
                  ainda não está publicado pela fonte oficial para São Paulo em nenhum dos anos
                  cobertos — veja a <Link href="/sao-paulo/educacao/comparativo" style={{ color: "var(--blue-40)" }}>situação do indicador de MDE</Link>.
                  O gasto total pelo RREO inclui todas as fontes (próprias + transferências).
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
                  {
                    label: `Liquidado ${anoAtual}`,
                    valor: fmt(atual.liquidado),
                    nota: "Gasto efetivamente liquidado em educação",
                  },
                  {
                    label: `Dotação inicial ${anoAtual}`,
                    valor: fmt(atual.dotacao),
                    nota: "Valor aprovado na LOA — antes de suplementações",
                  },
                  {
                    label: "% do orçamento",
                    valor: pctAtual ? `${pctAtual.toFixed(1)}%` : "—",
                    nota: "Participação da educação no total liquidado municipal",
                  },
                  {
                    label: "Variação 2015–" + anoAtual,
                    valor: growth !== null ? `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%` : "—",
                    nota: "Variação nominal do liquidado em educação",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={S.label} className="mb-1">{item.label}</p>
                    <p className="font-light mt-2" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
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
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Execução 2015–{anoAtual}</p>
                <h2 style={S.h2}>Evolução do gasto em educação</h2>
                <div style={S.borderTop}>
                  {serie.map((r) => (
                    <div key={r.ano} className="grid grid-cols-[auto_1fr_1fr_1fr] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--green-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "40px" }}>
                        {r.ano}
                      </span>
                      <div>
                        <p style={S.caption}>Dotação</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.dotacao)}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Liquidado</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: r.ano === anoAtual ? "var(--text-01)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>
                          {fmt(r.liquidado)}
                        </p>
                      </div>
                      <div>
                        <p style={S.caption}>% orçamento</p>
                        <p className="font-mono" style={{ fontSize: "12px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                          {r.totalMun > 0 ? `${(r.liquidado / r.totalMun * 100).toFixed(1)}%` : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <DadoQueMostra items={insights} />
              </div>
              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Dotação vs. liquidado por ano (R$)</p>
                <SerieHistorica data={serieChart} unit="bi" />
              </div>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Dados para download</p>
            <h2 style={{ ...S.h2, fontSize: "20px" }}>RREO Anexo 02 — execução por função (inclui educação)</h2>
            <p style={{ ...S.body, marginBottom: "20px", maxWidth: "640px" }}>
              Cada arquivo contém a execução orçamentária de todas as funções do Município de São Paulo
              no exercício. Para isolar a função Educação, filtre a coluna <code style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px" }}>Funcao</code> pelo valor &ldquo;Educação&rdquo;.
            </p>
            <div className="flex flex-wrap gap-3">
              {anosDisponiveis.slice().sort((a, b) => b - a).map((ano) => (
                <a
                  key={ano}
                  href={`/api/dados/sao_paulo/executivo/saida/despesas_executivo_sao_paulo_${ano}.csv`}
                  className="nav-link"
                  download
                >
                  CSV {ano}
                </a>
              ))}
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: SICONFI / Tesouro Nacional — RREO Anexo 02 (Demonstrativo da Execução das Despesas por Função/Subfunção). Município de São Paulo — IBGE 3550308. Valores nominais em BRL. Bimestre 6 (fechamento do exercício) quando disponível; {anoAtual} pode refletir bimestre parcial.
            </p>
          </div>
        </section>

        {/* Contexto */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Por que educação é a maior função do orçamento?</p>
                <p style={S.body}>
                  São Paulo administra a maior rede municipal de ensino do país, com centenas de milhares
                  de alunos em creches (CEIs), pré-escolas (EMEIs) e ensino fundamental (EMEFs). O tamanho
                  da rede, somado ao piso nacional do magistério e ao mínimo constitucional de aplicação
                  em MDE, faz da educação uma das maiores — e por vezes a maior — função de gasto do
                  orçamento municipal.
                </p>
                <p style={{ ...S.body, marginTop: "12px" }}>
                  O mínimo constitucional obrigatório é de 25% das receitas de impostos vinculadas
                  à educação (MDE). Os dados de MDE individual por receita são reportados ao SIOPE/FNDE,
                  mas não estão publicados pela fonte oficial para São Paulo em nenhum ano coberto por
                  este site — ver <Link href="/sao-paulo/educacao/comparativo" style={{ color: "var(--blue-40)" }}>detalhes na página de série histórica</Link>.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Sobre os dados</p>
                <p style={S.body}>
                  O RREO Anexo 02 consolida a execução orçamentária por função de governo. A função
                  12 — Educação — agrupa creche, pré-escola, ensino fundamental, ensino médio técnico,
                  educação especial e demais ações municipais em educação. Os valores são extraídos
                  do bimestre 6 (referência: 31 de dezembro) quando o exercício está fechado.
                </p>
                <p style={{ ...S.caption, marginTop: "12px", lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-03)" }}>Liquidado vs. pago:</strong>{" "}
                  O liquidado representa despesas reconhecidas (etapa anterior ao pagamento).
                  O valor pago pode ser ligeiramente inferior ao liquidado em virtude de restos a pagar.
                  Fonte primária: apidatalake.tesouro.gov.br/ords/siconfi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/educacao/comparativo" className="nav-link">Situação do MDE</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/receita" className="nav-link">Receitas</Link>
            <Link href="/sao-paulo/saude" className="nav-link">Saúde</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
