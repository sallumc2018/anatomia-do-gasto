import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"
import {
  getAvailableYearsExecutivo,
  loadExecutivoData,
  type ExecutivoRow,
} from "@/lib/data"
import { AnoSelector } from "@/components/ui/ano-selector"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { DonutFuncoes, type DonutPoint } from "@/components/charts/DonutFuncoes"

const MUNICIPIO = "paulinia"
const IBGE = "3536505"

export async function generateMetadata(): Promise<Metadata> {
  const anos = getAvailableYearsExecutivo(MUNICIPIO)
  const ultimo = anos[0] ?? 2025
  const primeiro = anos.length ? Math.min(...anos) : 2020
  const rows = anos[0] ? loadExecutivoData(anos[0], MUNICIPIO) : []
  const total = rows.find((r) => r.funcao === "TOTAL")?.liquidado ?? 0
  const totalBi = (total / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return {
    title: "Orçamento Municipal de Paulínia",
    description: `Como Paulínia distribuiu R$ ${totalBi} bilhões em ${ultimo} entre educação, saúde, transporte, previdência e todas as funções orçamentárias. Série histórica ${primeiro}–${ultimo}. Fonte: SICONFI/Tesouro Nacional.`,
    alternates: { canonical: "https://www.anatomiadogasto.ong.br/paulinia/executivo" },
  }
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
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

const SKIP_DISPLAY = new Set(["Reserva de Contingência", "TOTAL"])

const NOTAS: Record<string, string> = {
  "Administração":      "Inclui folha dos servidores municipais, gestão geral e RPPS",
  "Previdência Social": "RPPS — Regime Próprio de Previdência Social dos servidores + contribuições intra-orçamentárias",
  "Legislativa":        "Câmara Municipal de Paulínia",
  "Encargos Especiais": "Inclui amortização da dívida, serviços de terceiros e transferências intragovernamentais",
}

const FUNC_COLOR: Record<string, string> = {
  "Educação":          "var(--blue-60)",
  "Saúde":             "var(--blue-50)",
  "Administração":     "var(--border-02)",
  "Previdência Social":"var(--border-02)",
  "Transporte":        "var(--blue-40)",
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
}

// ─── Orçamento aprovado por lei (LOA) — fonte primária: leis municipais ──────
// Extraído do texto das leis orçamentárias sancionadas (Art. da estimativa da
// receita). Serve de validação cruzada independente contra a dotação inicial
// registrada no SICONFI/Tesouro.
const ORCAMENTO_LOA_CSV = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "..", "..", "data", "public", "paulinia", "orcamento", "saida",
  "loa_orcamento_aprovado_paulinia.csv",
)

interface LoaAprovado { ano: number; valor: number; lei: string; leiAno: string }

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue }
    if (c === "," && !inQ) { out.push(cur); cur = ""; continue }
    cur += c
  }
  out.push(cur)
  return out
}

function loadOrcamentoAprovado(): LoaAprovado[] {
  try {
    if (!fs.existsSync(ORCAMENTO_LOA_CSV)) return []
    const lines = fs.readFileSync(ORCAMENTO_LOA_CSV, "utf-8").split("\n").filter(Boolean)
    return lines
      .slice(1)
      .map((line) => {
        const f = parseCsvLine(line)
        return { ano: parseInt(f[0]), valor: parseFloat(f[1]), lei: (f[3] ?? "").trim(), leiAno: (f[4] ?? "").trim() }
      })
      .filter((r) => !Number.isNaN(r.ano) && r.valor > 0)
      .sort((a, b) => b.ano - a.ano)
  } catch {
    return []
  }
}

function pctExec(liquidado: number, dotacao: number): string {
  if (!dotacao) return "—"
  return `${((liquidado / dotacao) * 100).toFixed(1)}%`
}

interface SerieAnual { ano: number; dotacao: number; liquidado: number; funcoes: number }

function buildSerie(anos: number[]): SerieAnual[] {
  return anos
    .map((ano) => {
      const rows = loadExecutivoData(ano, MUNICIPIO)
      const total = rows.find((r) => r.funcao === "TOTAL")
      const funcoes = rows.filter((r) => !SKIP_DISPLAY.has(r.funcao) && r.liquidado > 0).length
      return { ano, dotacao: total?.dotacao_inicial ?? 0, liquidado: total?.liquidado ?? 0, funcoes }
    })
    .sort((a, b) => b.ano - a.ano)
}

export default async function PauliniaExecutivoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const params = await searchParams
  const anos = getAvailableYearsExecutivo(MUNICIPIO)
  const anoParam = params.ano && /^\d{4}$/.test(params.ano) ? parseInt(params.ano) : null
  const anoFeatured = anoParam && anos.includes(anoParam) ? anoParam : (anos[0] ?? 2025)

  const dadosFeatured = loadExecutivoData(anoFeatured, MUNICIPIO)
  const totalRow = dadosFeatured.find((r) => r.funcao === "TOTAL")
  const totalLiq = totalRow?.liquidado ?? 0
  const totalDot = totalRow?.dotacao_inicial ?? 0
  const totalDotAtualizada = totalRow?.dotacao_atualizada ?? totalDot

  const funcoes: ExecutivoRow[] = dadosFeatured
    .filter((r) => !SKIP_DISPLAY.has(r.funcao))
    .sort((a, b) => b.liquidado - a.liquidado)

  const serie = buildSerie(anos)

  // Orçamento aprovado por lei (LOA) + validação cruzada contra SICONFI
  const loaSerie = loadOrcamentoAprovado()
  const loaFeatured = loaSerie.find((l) => l.ano === anoFeatured)
  const loaDiffPct = loaFeatured && totalDot > 0
    ? ((loaFeatured.valor - totalDot) / totalDot * 100) : null

  const top2Pct = funcoes.slice(0, 2).reduce((s, r) => s + r.liquidado, 0) / (totalLiq || 1) * 100
  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: s.dotacao,
    liquidado: s.liquidado,
  }))

  const DONUT_PALETTE = ["#0f62fe", "#4589ff", "#78a9ff", "#a6c8ff", "#6f6f6f", "#525252", "#393939"]
  const funcoesComGasto = funcoes.filter((f) => f.liquidado > 0)
  const topN = funcoesComGasto.slice(0, 6)
  const outrasSoma = funcoesComGasto.slice(6).reduce((sum, f) => sum + f.liquidado, 0)
  const donutData: DonutPoint[] = [
    ...topN.map((f, i) => ({ nome: f.funcao, valor: f.liquidado, color: DONUT_PALETTE[i]! })),
    ...(outrasSoma > 0 ? [{ nome: "Outras", valor: outrasSoma, color: "#393939" }] : []),
  ]

  const anoAnteriorData = serie.find((s) => s.ano === anoFeatured - 1)
  const yoyChange = anoAnteriorData && anoAnteriorData.liquidado > 0
    ? ((totalLiq - anoAnteriorData.liquidado) / anoAnteriorData.liquidado * 100) : null
  const s2020 = serie.find((s) => s.ano === 2020)
  const growthSerie = s2020 && s2020.liquidado > 0 && anoFeatured > 2020
    ? ((totalLiq - s2020.liquidado) / s2020.liquidado * 100) : null
  const execRate = totalDotAtualizada > 0 ? (totalLiq / totalDotAtualizada * 100) : null
  const topFunc = funcoes[0]
  const topFuncPct = topFunc && totalLiq > 0 ? (topFunc.liquidado / totalLiq * 100) : 0

  const insights: string[] = [
    ...(yoyChange !== null
      ? [`O gasto total ${yoyChange >= 0 ? "cresceu" : "recuou"} ${Math.abs(yoyChange).toFixed(1)}% em relação a ${anoFeatured - 1} (de ${fmt(anoAnteriorData!.liquidado)} para ${fmt(totalLiq)}).`]
      : []),
    ...(growthSerie !== null
      ? [`Entre 2020 e ${anoFeatured}, o gasto municipal acumulou variação de +${growthSerie.toFixed(0)}% — passando de ${fmt(s2020!.liquidado)} para ${fmt(totalLiq)}.`]
      : []),
    ...(execRate !== null
      ? [`${execRate.toFixed(1)}% do orçamento atualizado foi efetivamente liquidado em ${anoFeatured}.`]
      : []),
    ...(topFunc
      ? [`${topFunc.funcao} concentrou ${topFuncPct.toFixed(1)}% do gasto total, a maior função orçamentária do município.`]
      : []),
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Orçamento Municipal · Paulínia/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoFeatured}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                A anatomia completa do gasto municipal
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Em {anoFeatured}, o orçamento municipal total fixado foi de{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(totalDot)}</strong> e a despesa liquidada foi de{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(totalLiq)}</strong> — distribuída em{" "}
                {funcoes.length} funções orçamentárias. Educação e Saúde juntas representam{" "}
                <strong style={{ color: "var(--text-01)" }}>{top2Pct.toFixed(0)}%</strong> do total.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                O Relatório Resumido da Execução Orçamentária (RREO) Anexo 02 agrega o orçamento
                municipal por função, incluindo Prefeitura, RPPS e Câmara Municipal. Os valores
                exibidos são do SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público
                Brasileiro)/Tesouro Nacional (encerramento do 6º bimestre) — o número oficial.
              </p>
              <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 02 · 6º bimestre · IBGE {IBGE}</p>
            </div>
          </div>
        </section>

        {/* Nota metodológica 2022 — OBRIGATÓRIA */}
        {(anoFeatured === 2022 || anos.includes(2022)) && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-4" style={S.container}>
              <div className="p-4" style={{ border: "1px solid var(--border-02)", borderLeft: "4px solid var(--yellow-30)" }}>
                <p style={{ ...S.caption, lineHeight: "18px" }}>
                  <strong style={{ color: "var(--text-02)" }}>Nota metodológica — 2022:</strong>{" "}
                  Para o ano de 2022, o somatório dos registros granulares do TCE-SP (Portal de Transparência)
                  é R$&nbsp;7,2 milhões (~0,4%) superior ao total do RREO Anexo 02 registrado no SICONFI.
                  Os números exibidos nesta página são os do <strong style={{ color: "var(--text-01)" }}>SICONFI</strong>,
                  que é o dado oficial encerrado. A divergência está documentada em{" "}
                  <Link href="/metodologia" style={{ color: "var(--text-02)", textDecoration: "underline" }}>
                    nossa metodologia
                  </Link>.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { label: `LOA fixada ${anoFeatured}`,  valor: fmt(totalDot),                        nota: "Dotação inicial aprovada (LOA)" },
                { label: `Liquidado ${anoFeatured}`,   valor: fmt(totalLiq),                        nota: "Despesa efetivamente liquidada" },
                { label: "% executado",                valor: pctExec(totalLiq, totalDotAtualizada), nota: "Liquidado ÷ dotação atualizada" },
                { label: "Funções com gasto",          valor: String(funcoes.filter((r) => r.liquidado > 0).length), nota: "Das 28 funções orçamentárias" },
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

        {/* Seletor de ano */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-4" style={S.container}>
            <div className="flex flex-wrap items-center gap-4">
              <p style={{ ...S.label, marginBottom: 0 }}>Ano de referência</p>
              <AnoSelector anos={anos} selectedAno={anoFeatured} basePath="/paulinia/executivo" />
            </div>
          </div>
        </section>

        {/* Anatomia por função */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Anatomia {anoFeatured}</p>
                <h2 style={S.h2}>Distribuição por função orçamentária</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Cada função representa uma área de atuação definida pela Portaria SOF 42/1999.
                  A barra horizontal indica a proporção do total liquidado.
                </p>
                <div className="p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.caption, lineHeight: "18px" }}>
                    <strong style={{ color: "var(--text-02)" }}>Nota sobre Encargos Especiais:</strong>{" "}
                    Paulínia tem receita expressiva de royalties e participações especiais do petróleo, o que amplia
                    receitas e, por consequência, gastos em encargos financeiros e de resultado primário.
                  </p>
                </div>
              </div>

              <div style={S.borderTop}>
                {funcoes.map((fn) => {
                  const pct = totalLiq > 0 ? (fn.liquidado / totalLiq) * 100 : 0
                  const barColor = FUNC_COLOR[fn.funcao] ?? "var(--blue-60)"
                  const nota = NOTAS[fn.funcao]
                  return (
                    <div key={fn.funcao} className="py-4" style={S.borderBottom}>
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <span style={{ ...S.body, color: fn.liquidado > 0 ? "var(--text-01)" : "var(--text-04)" }}>
                          {fn.funcao}
                        </span>
                        <span className="font-mono" style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {fn.liquidado > 0 ? fmt(fn.liquidado) : "—"}
                        </span>
                      </div>
                      <div style={{ height: "3px", backgroundColor: "var(--border-01)", borderRadius: "2px", marginBottom: "4px" }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: barColor, borderRadius: "2px", transition: "width 0.3s" }} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <p style={S.caption}>{nota ?? `Fixado: ${fmt(fn.dotacao_inicial)}`}</p>
                        <p style={{ ...S.caption, whiteSpace: "nowrap" }}>{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                  )
                })}
                <div className="py-4 flex items-baseline justify-between gap-4">
                  <span className="font-semibold" style={{ ...S.body, color: "var(--text-01)" }}>TOTAL</span>
                  <span className="font-mono font-semibold" style={{ fontSize: "15px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {fmt(totalLiq)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Donut */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Composição {anoFeatured}</p>
                <h2 style={{ ...S.h2, fontSize: "20px" }}>Top funções por gasto liquidado</h2>
                <p style={{ ...S.body, color: "var(--text-03)" }}>
                  As 6 maiores funções orçamentárias concentram a maior parte do gasto municipal.
                </p>
              </div>
              <DonutFuncoes data={donutData} />
            </div>
          </div>
        </section>

        {/* Tabela detalhada */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Detalhe por função · {anoFeatured}</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={S.borderBottom}>
                    {["Função", "Fixado (LOA)", "Atualizado", "Liquidado", "% do total", "% exec. (atu.)"].map((col) => (
                      <th key={col} style={{ ...S.label, textAlign: col === "Função" ? "left" : "right", paddingBottom: "8px", paddingRight: col !== "% exec. (atu.)" ? "24px" : "0", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {funcoes.map((fn) => {
                    const pct = totalLiq > 0 ? (fn.liquidado / totalLiq) * 100 : 0
                    return (
                      <tr key={fn.funcao} style={S.borderBottom}>
                        <td style={{ ...S.body, color: fn.liquidado > 0 ? "var(--text-01)" : "var(--text-04)", paddingTop: "10px", paddingBottom: "10px", paddingRight: "24px" }}>
                          {fn.funcao}
                        </td>
                        <td style={{ ...S.body, color: "var(--text-02)", textAlign: "right", paddingRight: "24px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {fmt(fn.dotacao_inicial)}
                        </td>
                        <td style={{ ...S.body, color: "var(--text-02)", textAlign: "right", paddingRight: "24px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {fmt(fn.dotacao_atualizada)}
                        </td>
                        <td style={{ ...S.body, color: fn.liquidado > 0 ? "var(--text-01)" : "var(--text-04)", textAlign: "right", paddingRight: "24px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", fontWeight: fn.liquidado > 2e8 ? 600 : 400 }}>
                          {fn.liquidado > 0 ? fmt(fn.liquidado) : "—"}
                        </td>
                        <td style={{ ...S.body, color: "var(--text-03)", textAlign: "right", paddingRight: "24px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {pct > 0 ? `${pct.toFixed(1)}%` : "—"}
                        </td>
                        <td style={{ ...S.body, color: "var(--text-03)", textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                          {fn.dotacao_atualizada > 0 ? pctExec(fn.liquidado, fn.dotacao_atualizada) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td colSpan={3} style={{ ...S.body, color: "var(--text-01)", fontWeight: 700, paddingTop: "12px", paddingRight: "24px" }}>
                      TOTAL
                    </td>
                    <td style={{ ...S.body, color: "var(--text-01)", fontWeight: 700, textAlign: "right", paddingRight: "24px", paddingTop: "12px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmt(totalLiq)}
                    </td>
                    <td style={{ ...S.body, color: "var(--text-03)", textAlign: "right", paddingRight: "24px", paddingTop: "12px" }}>100%</td>
                    <td style={{ ...S.body, color: "var(--text-03)", textAlign: "right", paddingTop: "12px", fontVariantNumeric: "tabular-nums" }}>
                      {pctExec(totalLiq, totalDotAtualizada)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-6" style={S.caption}>
              Valores em reais. Liquidado = despesa reconhecida e verificada, exceto e intra-orçamentária somados.
              {" "}Fonte oficial: SICONFI RREO Anexo 02 · 6º bimestre · IBGE {IBGE}.
            </p>
          </div>
        </section>

        {/* Série histórica */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Série histórica · 2020–{anoFeatured}</p>
            <div style={S.borderTop}>
              {serie.map((s) => {
                const pct = s.dotacao > 0 ? (s.liquidado / s.dotacao) * 100 : 0
                const isLatest = s.ano === anoFeatured
                return (
                  <div key={s.ano} className="mobile-loa-row grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-6 py-4" style={S.borderBottom}>
                    <span className="font-mono font-semibold" style={{ fontSize: "15px", color: isLatest ? "var(--blue-40)" : "var(--text-01)", minWidth: "40px" }}>
                      {s.ano}
                    </span>
                    <div>
                      <p style={S.caption}>Fixado (LOA)</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>{fmt(s.dotacao)}</p>
                    </div>
                    <div>
                      <p style={S.caption}>Liquidado</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>{fmt(s.liquidado)}</p>
                    </div>
                    <div>
                      <p style={S.caption}>% executado</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p style={S.caption}>Funções</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-03)", fontVariantNumeric: "tabular-nums" }}>{s.funcoes}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-10">
              <p className="uppercase font-semibold mb-4" style={S.label}>Evolução gráfica 2020–{anoFeatured}</p>
              <SerieHistorica data={serieChartData} unit="bi" />
            </div>
            {insights.length > 0 && <div className="mt-10"><DadoQueMostra items={insights} /></div>}
          </div>
        </section>

        {/* Contexto metodológico */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              <div className="py-8 md:pr-12" style={S.borderBottom}>
                <p className="uppercase font-semibold mb-4" style={S.label}>O que este total representa</p>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  O RREO Anexo 02 consolida todos os órgãos e entidades municipais por função: Prefeitura,
                  RPPS (Paulínia Previ) e Câmara Municipal. É o número oficial encerrado ao final do exercício.
                </p>
                <div className="flex flex-wrap gap-4" style={{ fontSize: "13px" }}>
                  <Link href="/paulinia/receita" style={{ color: "var(--blue-40)", textDecoration: "none" }}>→ Receita municipal</Link>
                  <Link href="/paulinia/saude-fiscal" style={{ color: "var(--blue-40)", textDecoration: "none" }}>→ Saúde fiscal (LRF)</Link>
                </div>
              </div>
              <div className="mobile-indexed-cell py-8 md:pl-12" style={{ borderLeft: "1px solid var(--border-01)", ...S.borderBottom }}>
                <p className="uppercase font-semibold mb-4" style={S.label}>O que ainda não temos</p>
                <ul className="flex flex-col gap-3">
                  {[
                    "Detalhamento por unidade orçamentária dentro de cada função (secretaria/autarquia)",
                    "Contratos e licitações por função (PNCP disponível a partir de 2023)",
                    "Dados de saúde e educação por LRF quadrimestral (em coleta)",
                    "Correção pela inflação (IPCA) na série histórica",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <span style={{ ...S.mono, flexShrink: 0, marginTop: "2px", color: "var(--text-04)" }}>—</span>
                      <p style={{ ...S.body, fontSize: "14px", color: "var(--text-03)" }}>{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Orçamento aprovado por lei (LOA) + validação cruzada */}
        {loaSerie.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Orçamento aprovado pela Câmara (LOA)</p>
              <h2 style={S.h2}>Quanto a Câmara autorizou de orçamento — e o que o Tesouro registrou</h2>
              <p style={{ ...S.body, maxWidth: "720px", marginBottom: "8px" }}>
                Todo ano a Câmara Municipal aprova a Lei Orçamentária Anual (LOA), que estima a receita e
                fixa a despesa do município. Extraímos esse valor diretamente do texto de cada lei
                sancionada e o comparamos com a dotação inicial registrada no SICONFI/Tesouro — duas fontes
                independentes que devem concordar.
              </p>
              {loaFeatured && (
                <p style={{ ...S.body, maxWidth: "720px", marginBottom: "24px", color: "var(--text-03)" }}>
                  Para {anoFeatured}, a Lei Municipal nº {loaFeatured.lei}/{loaFeatured.leiAno} aprovou{" "}
                  <strong style={{ color: "var(--text-01)" }}>{fmt(loaFeatured.valor)}</strong>. O SICONFI
                  registra dotação inicial de <strong style={{ color: "var(--text-01)" }}>{fmt(totalDot)}</strong>
                  {loaDiffPct !== null && Math.abs(loaDiffPct) < 0.005
                    ? " — valores idênticos."
                    : loaDiffPct !== null
                      ? ` — diferença de ${Math.abs(loaDiffPct).toFixed(2)}%. As duas fontes registram o orçamento em estágios distintos (lei sancionada e execução no Tesouro) e podem divergir levemente.`
                      : "."}
                </p>
              )}
              <div style={S.borderTop}>
                <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4 py-3" style={{ ...S.borderBottom, ...S.label }}>
                  <span style={{ minWidth: "40px" }}>Ano</span>
                  <span>Aprovado em lei (LOA)</span>
                  <span>Dotação inicial (SICONFI)</span>
                  <span style={{ textAlign: "right" }}>Lei</span>
                </div>
                {loaSerie.map((l) => {
                  const dot = serie.find((s) => s.ano === l.ano)?.dotacao ?? 0
                  return (
                    <div key={l.ano} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4 py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: l.ano === anoFeatured ? "var(--blue-40)" : "var(--text-03)", fontWeight: l.ano === anoFeatured ? 600 : 400, minWidth: "40px" }}>
                        {l.ano}
                      </span>
                      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>{fmt(l.valor)}</span>
                      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>{dot > 0 ? fmt(dot) : "—"}</span>
                      <span style={{ ...S.caption, textAlign: "right" }}>nº {l.lei}/{l.leiAno}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/api/dados/paulinia/orcamento/saida/loa_orcamento_aprovado_paulinia.csv"
                  className="nav-link"
                  download
                >
                  Baixar série LOA (CSV)
                </a>
              </div>
              <p className="mt-4" style={S.caption}>
                Fonte: Leis Orçamentárias Anuais de Paulínia (texto das leis sancionadas), confrontadas com
                SICONFI/Tesouro. Na LOA, a receita estimada é igual à despesa fixada (orçamento equilibrado,
                art. 165 da Constituição e Lei 4.320/1964).
              </p>
            </div>
          </section>
        )}

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Fonte declarada</p>
            <div style={S.borderTop}>
              <div className="py-6" style={S.borderBottom}>
                <p style={{ ...S.body, color: "var(--text-01)", fontWeight: 600, marginBottom: "4px", fontSize: "14px" }}>
                  SICONFI — RREO Anexo 02 · Tesouro Nacional
                </p>
                <p style={{ ...S.caption, marginBottom: "8px" }}>
                  Fonte oficial — despesas por função orçamentária, 6º bimestre de cada exercício (2020–{anoFeatured}).
                  API pública do Tesouro Nacional. IBGE {IBGE} = Paulínia/SP.
                </p>
                <TrackedExternalLink
                  href={`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=${anoFeatured}&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=${IBGE}&no_anexo=RREO-Anexo%2002&co_poder=E`}
                  area="executivo"
                  label="siconfi"
                  style={{ ...S.mono, textDecoration: "underline", wordBreak: "break-all", fontSize: "12px" }}
                >
                  siconfi.tesouro.gov.br — RREO Anexo 02 · {anoFeatured}
                </TrackedExternalLink>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/paulinia" className="nav-link">← Paulínia</Link>
            <Link href="/paulinia/receita" className="nav-link">Receita municipal</Link>
            <Link href="/paulinia/saude-fiscal" className="nav-link">Saúde fiscal</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
