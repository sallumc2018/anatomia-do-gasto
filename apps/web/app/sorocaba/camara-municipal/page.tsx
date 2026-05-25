import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"
import { getPoderPublicoSorocaba } from "@/lib/agentes"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"

const DATA_ROOT = path.join(process.cwd(), "..", "..", "data", "public")

function parseBrFloat(s: string): number {
  return parseFloat(s.replace(/"/g, "").trim().replace(/\./g, "").replace(",", ".")) || 0
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ""
  let inQ = false
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue }
    if (c === "," && !inQ) { fields.push(cur); cur = ""; continue }
    cur += c
  }
  fields.push(cur)
  return fields
}

interface CamaraTceRow { ano: number; evento: string; total: number; count: number }

function loadCamaraTce(): CamaraTceRow[] {
  const fp = path.join(DATA_ROOT, "sorocaba", "camara", "saida", "camara_despesas_tce_2020_2026.csv")
  if (!fs.existsSync(fp)) return []
  const lines = fs.readFileSync(fp, "utf-8").split("\n")
  // header: ano,mes,orgao,evento,nr_empenho,id_fornecedor,nm_fornecedor,dt_emissao_despesa,vl_despesa
  const byKey: Record<string, CamaraTceRow> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const f = parseCsvLine(line)
    if (f.length < 9) continue
    const ano = parseInt(f[0])
    const evento = f[3]?.trim() ?? ""
    const vl = parseBrFloat(f[8] ?? "0")
    if (isNaN(ano) || !evento) continue
    const key = `${ano}-${evento}`
    if (!byKey[key]) byKey[key] = { ano, evento, total: 0, count: 0 }
    byKey[key].total += vl
    byKey[key].count++
  }
  return Object.values(byKey).sort((a, b) =>
    a.ano !== b.ano ? a.ano - b.ano : a.evento.localeCompare(b.evento)
  )
}

export const metadata: Metadata = {
  title: "Câmara Municipal de Sorocaba",
  description:
    "25 vereadores da 19ª Legislatura, composição por partido, subsídios e custo institucional. LOA 2024: R$ 88,6 milhões. O que está mapeado e o que ainda falta.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/camara-municipal" },
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
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  caption: {
    fontSize: "12px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

// Série histórica LOA Câmara — todas as fontes são oficiais (PDFs das LOAs + SICONFI RREO 6º bimestre)
const LOA_SERIE = [
  { ano: 2025, fixado: 96_370_000, executado: 80_786_792,  fonte: "Fixado: Lei 13.106/2024 (PDF oficial) · Realizado: SICONFI RREO 6º bimestre 2025", tipo: "oficial" },
  { ano: 2024, fixado: 88_584_000, executado: 66_057_983,  fonte: "Fixado: Lei 12.941/2023 (PDF oficial) · Realizado: SICONFI RREO 6º bimestre",      tipo: "oficial" },
  { ano: 2023, fixado: 78_960_000, executado: 62_369_701,  fonte: "Fixado: Lei 12.703/2022 (PDF oficial) · Realizado: SICONFI RREO 6º bimestre",      tipo: "oficial" },
  { ano: 2022, fixado: 69_213_000, executado: 55_995_860,  fonte: "Fixado: Lei 12.474/2021 (PDF oficial) · Realizado: SICONFI RREO 6º bimestre",      tipo: "oficial" },
  { ano: 2021, fixado: 59_988_000, executado: 47_346_240,  fonte: "Fixado: Lei 12.272/2020 (PDF oficial) · Realizado: SICONFI RREO 6º bimestre",      tipo: "oficial" },
  { ano: 2020, fixado: 60_222_000, executado: 50_240_303,  fonte: "Fixado: SICONFI RREO (dotação confirmada = R$ 60,222 mi) · Realizado: SICONFI RREO 6º bimestre", tipo: "oficial" },
]

// Devoluções de saldo à Prefeitura — fato notável para a narrativa
const DEVOLUCOES = [
  { ano: 2021, valor: 11_500_000, nota: "Maior devolução registrada — ~19% do duodécimo recebido no ano" },
  { ano: 2020, valor:  5_000_000, nota: "Devolução do saldo não utilizado no exercício" },
]

// Evolução de subsídios por legislatura
const SUBSIDIOS_LEGISLATURAS = [
  {
    leg: "19ª Legislatura · 2025–2028",
    vereadores: 25,
    subsidio: 18_000.00,
    presidente: 18_900.00,
    detalhe: "Reajuste de +52,95% aprovado em 04/04/2023 — segundo o Jornal Cruzeiro, a votação durou menos de 10 segundos",
    novo: true,
  },
  {
    leg: "18ª Legislatura · 2021–2024",
    vereadores: 20,
    subsidio: 11_838.14,
    presidente: 13_705.08,
    detalhe: "Valor congelado desde 2017 — Resolução 05/2020 manteve para toda a legislatura",
    novo: false,
  },
]

// Evolução do quadro de servidores e assessores
const ASSESSORES_SERIE = [
  { ref: "Fev/2026", servidores: 319, assessoresPorVer: 5,  nota: "25 novos cargos criados — R$ 5,5 mi/ano adicionais" },
  { ref: "Jan/2025", servidores: 294, assessoresPorVer: 4,  nota: "Folha +65% vs jan/2021 (mais 5 vereadores + reajuste salarial)" },
  { ref: "Jan/2024", servidores: 239, assessoresPorVer: 4,  nota: "Redução determinada pelo TCE-SP" },
  { ref: "Jan/2021", servidores: 259, assessoresPorVer: 6,  nota: "Limite anterior: até 6 assessores por vereador" },
]

// Dados de custo institucional — fonte: LOA 2024 e imprensa local (Jornal Cruzeiro)
const CUSTO_INSTITUCIONAL = [
  {
    item: "Subsídios brutos mensais (25 vereadores)",
    valor: 450900,
    valorFmt: "R$ 450.900,00/mês",
    fonte: "Câmara Municipal — subsídios 2026",
    tipo: "oficial",
  },
  {
    item: "Assessores parlamentares (70 profissionais, até 4 por vereador)",
    valor: 604472.92,
    valorFmt: "R$ 604.472,92/mês",
    fonte: "Jornal Cruzeiro (reportagem jun/2025 — informação atribuída à Câmara)",
    tipo: "imprensa",
  },
  {
    item: "Verba de gabinete (R$ 15.457,72/vereador/mês · média 2023)",
    valor: 15457.72 * 25,
    valorFmt: "R$ 386.443,00/mês",
    fonte: "Portal Transparência Sorocaba — média mensal por vereador (2023)",
    tipo: "imprensa",
  },
]

const AUSENCIAS = [
  "Produção legislativa por ano e por vereador: projetos apresentados, aprovados, rejeitados e vetados",
  "Presença em plenário e votações nominais — disponível no portal Câmara Sem Papel, sem extração estruturada",
  "Verba de gabinete individual por vereador em 2025 — valor estimado via média 2023",
  "Emendas parlamentares individuais — coleta em planejamento",
  "Custo por rubrica: servidores concursados, manutenção predial, contratos de TI e custeio",
]

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
}

function formatMillions(value: number): string {
  const m = value / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
}

export default function CamaraMunicipalPage() {
  const tceRows = loadCamaraTce()
  const dados = getPoderPublicoSorocaba()
  const grupoVereadores = dados.grupos.find((g) => g.id === "vereadores")
  const vereadores = grupoVereadores?.pessoas ?? []
  const fontes = dados.fontes

  const totalMensalSubsidios = vereadores.reduce((sum, v) => sum + (v.remuneracao?.valor_bruto_mensal ?? 0), 0)
  const totalAnualSubsidios = totalMensalSubsidios * 12

  const LOA_2024 = 88_584_000
  const pctSubsidiosLOA = ((totalAnualSubsidios / LOA_2024) * 100).toFixed(2)

  const vereadoras = vereadores.filter((v) => v.cargo === "Vereadora")

  const porPartido = vereadores.reduce<Record<string, number>>((acc, v) => {
    if (v.partido) acc[v.partido] = (acc[v.partido] ?? 0) + 1
    return acc
  }, {})
  const partidosOrdenados = Object.entries(porPartido).sort((a, b) => b[1] - a[1])

  const fonteCamara   = fontes.find((f) => f.id === "camara-sorocaba-posse-2025")
  const fonteSubsidios = fontes.find((f) => f.id === "camara-sorocaba-subsidios-2026")

  // Gráfico e "E daí?"
  const loaChartData: SerieHistoricaPoint[] = LOA_SERIE
    .slice()
    .sort((a, b) => a.ano - b.ano)
    .map((s) => ({ ano: String(s.ano), fixado: s.fixado, liquidado: s.executado }))

  const loa2020 = LOA_SERIE.find((s) => s.ano === 2020)!
  const loaAtual = LOA_SERIE[0]! // 2025
  const varLOA = ((loaAtual.fixado - loa2020.fixado) / loa2020.fixado * 100)
  const seriesComExec = LOA_SERIE.filter((s) => s.executado > 0)
  const avgExecRate = seriesComExec.length > 0
    ? seriesComExec.reduce((sum, s) => sum + s.executado / s.fixado, 0) / seriesComExec.length * 100
    : null
  const subsidioAtual    = SUBSIDIOS_LEGISLATURAS[0]!.subsidio
  const subsidioAnterior = SUBSIDIOS_LEGISLATURAS[1]!.subsidio
  const varSubsidio = ((subsidioAtual - subsidioAnterior) / subsidioAnterior * 100)
  const maiorDev = DEVOLUCOES.reduce((p, c) => c.valor > p.valor ? c : p)

  const camaraInsights: string[] = [
    `A LOA da Câmara cresceu ${varLOA.toFixed(0)}% entre 2020 e 2025 — de ${formatMillions(loa2020.fixado)} para ${formatMillions(loaAtual.fixado)}.`,
    ...(avgExecRate !== null
      ? [`A taxa de execução média no período foi de ${avgExecRate.toFixed(1)}% — a diferença entre fixado e liquidado retorna como saldo ou devolução.`]
      : []),
    `O subsídio dos vereadores da 19ª Legislatura é ${varSubsidio.toFixed(1)}% maior que o da 18ª — passou de ${formatBRL(subsidioAnterior)}/mês para ${formatBRL(subsidioAtual)}/mês.`,
    `Em ${maiorDev.ano}, a Câmara devolveu ${formatMillions(maiorDev.valor)} à Prefeitura — ${maiorDev.nota}.`,
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
                <p className="uppercase font-semibold" style={S.label}>Câmara Municipal · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  19ª Legislatura · 2025–2028
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                O Legislativo municipal e quanto ele custa
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "20px" }}>
                A Câmara Municipal legisla sobre assuntos locais, aprova a Lei Orçamentária Anual
                e fiscaliza a Prefeitura. Esta página mostra a composição dos {vereadores.length} vereadores,
                os subsídios brutos oficiais e o custo institucional parcialmente mapeado.
                O orçamento total da câmara em 2024 foi de{" "}
                <strong style={{ color: "var(--text-01)" }}>R$ 88,6 milhões</strong> fixados na LOA
                (Lei 12.941/2023) e R$ 66,1 milhões executados — os subsídios representam cerca de {pctSubsidiosLOA}% da LOA.
              </p>
              <p style={S.caption}>
                Dados de LOA e despesa realizada: PDFs oficiais das LOAs municipais + SICONFI/Tesouro Nacional · Subsídios: Câmara Municipal
              </p>
            </div>
          </div>
        </section>

        {/* Números-chave */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Vereadores", valor: String(vereadores.length), nota: "19ª Legislatura · 2025–2028" },
                { label: "LOA câmara 2024", valor: "R$ 88,6 mi", nota: "Lei 12.941/2023 · executado: R$ 66,1 mi" },
                { label: "Subsídios / ano", valor: formatMillions(totalAnualSubsidios), nota: "Valor anual · subsídios brutos oficiais 2026" },
                { label: "Partidos", valor: String(partidosOrdenados.length), nota: `${vereadoras.length} vereadoras · ${Math.round((vereadoras.length / vereadores.length) * 100)}% da câmara` },
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

        {/* Competências constitucionais */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>O que a Câmara Municipal deve fazer</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 style={{ ...S.h2, marginBottom: "16px" }}>Mandato constitucional</h2>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  A Câmara Municipal exerce duas funções constitucionais principais: <strong style={{ color: "var(--text-01)" }}>legislar</strong> sobre
                  matérias de interesse local e <strong style={{ color: "var(--text-01)" }}>fiscalizar</strong> o Poder Executivo municipal.
                  Essas atribuições estão definidas nos arts. 29 e 30 da Constituição Federal e na Lei Orgânica de Sorocaba.
                </p>
                <p style={S.caption}>
                  Arts. 29, 30 e 31 da CF/1988 · Lei Orgânica de Sorocaba · art. 29-A (limite de gastos do Legislativo)
                </p>
              </div>
              <div>
                <ul className="flex flex-col gap-3">
                  {[
                    { ato: "Legislar", desc: "Criar leis municipais sobre assuntos de interesse local — urbanismo, posturas, serviços públicos, tributos locais" },
                    { ato: "Aprovar LOA", desc: "Votar a Lei Orçamentária Anual, LDO e PPA — autoriza como a Prefeitura gasta o dinheiro público" },
                    { ato: "Fiscalizar", desc: "Apreciar as contas anuais do Prefeito; convocar secretários; instaurar CPIs" },
                    { ato: "Autorizar", desc: "Operações de crédito, alienação de bens, criação de cargos, concessões e permissões" },
                    { ato: "Audiências públicas", desc: "Ouvir a sociedade antes de votações relevantes — obrigatório para o processo orçamentário" },
                  ].map(({ ato, desc }) => (
                    <li key={ato} className="flex gap-3 items-start">
                      <span className="font-mono font-semibold" style={{ fontSize: "11px", color: "var(--blue-40)", flexShrink: 0, marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{ato}</span>
                      <p style={{ ...S.body, color: "var(--text-03)", fontSize: "13px" }}>{desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Custo institucional */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12">
              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Custo institucional parcial</p>
                <h2 style={S.h2}>O subsídio é menos de 7% do orçamento total</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  A LOA 2024 fixou R$ 88,6 milhões para a Câmara Municipal (Lei 12.941/2023) —
                  gasto efetivo (liquidado): R$ 66,1 milhões (SICONFI RREO 2024).
                  Os subsídios dos {vereadores.length} vereadores somam {formatMillions(totalAnualSubsidios)}/ano
                  ({pctSubsidiosLOA}% da LOA).
                  O limite constitucional (art. 29-A) é de 4,5% da receita tributária municipal
                  para o total do Legislativo — não apenas para os subsídios.
                </p>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Os itens abaixo representam custos conhecidos com fonte e período declarados.
                  O custo total por vereador ao cidadão não pode ser calculado com precisão:
                  não há tabela estruturada por rubrica e por vereador nesta base pública do projeto.
                </p>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O selo Oficial identifica dados publicados por fonte institucional. O selo Imprensa/Transp.
                  marca contexto jornalístico ou informação atribuída ao portal de transparência, sem substituir
                  validação oficial.
                </p>
                <p style={S.caption}>Dado ausente não é zero — o custo real é maior que a soma abaixo.</p>
              </div>
              <div>
                <div style={S.borderTop}>
                  {CUSTO_INSTITUCIONAL.map((linha) => (
                    <div key={linha.item} className="py-5" style={S.borderBottom}>
                      <div className="mobile-value-row flex items-start justify-between gap-4">
                        <p style={{ ...S.body, color: "var(--text-02)", flex: 1 }}>{linha.item}</p>
                        <p className="font-mono font-semibold" style={{ fontSize: "15px", color: "var(--text-01)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                          {linha.valorFmt}
                        </p>
                      </div>
                      <p className="mt-2 flex items-center gap-2" style={S.caption}>
                        <span style={{
                          fontSize: "9px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          border: "1px solid var(--border-01)",
                          padding: "1px 5px",
                          color: linha.tipo === "oficial" ? "var(--blue-40)" : "var(--text-04)",
                        }}>
                          {linha.tipo === "oficial" ? "Oficial" : "Imprensa/Transp."}
                        </span>
                        {linha.fonte}
                      </p>
                    </div>
                  ))}
                  <div className="py-4" style={S.borderBottom}>
                    <p style={{ ...S.caption, color: "var(--text-04)" }}>
                      Os itens acima têm períodos declarados mas não foram normalizados para comparação direta.
                      Dado ausente não é zero — o custo real é maior que os valores listados.
                    </p>
                  </div>
                  <p className="pt-4" style={S.caption}>
                    Exclui: servidores concursados, contratos de custeio, manutenção, tecnologia e infraestrutura.
                    LOA 2024 (Lei 12.941/2023): R$ 88,6 mi · Gasto efetivo 2024 (SICONFI): R$ 66,1 mi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Série histórica */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Série histórica · 2020–2025</p>

            {/* LOA por ano */}
            <div className="mb-12">
              <h2 style={{ ...S.h2, fontSize: "20px", marginBottom: "4px" }}>Orçamento da Câmara por ano</h2>
              <p style={{ ...S.caption, marginBottom: "16px" }}>
                Valor fixado na LOA (PDFs oficiais das Leis municipais 2020–2025) e despesa realizada (SICONFI RREO 6º bimestre). Todas as fontes são oficiais — ver seção de fontes abaixo.
              </p>
              <div style={S.borderTop}>
                {LOA_SERIE.map((linha) => (
                  <div key={linha.ano} className="mobile-loa-row grid grid-cols-[auto_1fr_1fr_auto] items-center gap-6 py-4" style={S.borderBottom}>
                    <span className="font-mono font-semibold" style={{ fontSize: "15px", color: linha.tipo === "pendente" ? "var(--text-04)" : "var(--text-01)", minWidth: "40px" }}>{linha.ano}</span>
                    <div>
                      <p style={S.caption}>Fixado (LOA)</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: linha.fixado ? "var(--text-01)" : "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>
                        {linha.fixado ? formatMillions(linha.fixado) : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={S.caption}>Realizado</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: linha.executado ? "var(--text-01)" : "var(--text-04)", fontVariantNumeric: "tabular-nums" }}>
                        {linha.executado ? formatMillions(linha.executado) : linha.ano === 2025 ? "em execução" : "—"}
                      </p>
                    </div>
                    <span style={{
                      fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase",
                      border: "1px solid var(--border-01)", padding: "1px 5px",
                      color: linha.tipo === "oficial" ? "var(--blue-40)" : linha.tipo === "pendente" ? "var(--text-04)" : "var(--text-04)",
                      whiteSpace: "nowrap",
                    }}>
                      {linha.tipo === "oficial" ? "Oficial" : linha.tipo === "pendente" ? "Pendente" : "Imprensa"}
                    </span>
                  </div>
                ))}
                <div className="mobile-card-footer py-4 flex items-center justify-between gap-4" style={S.borderBottom}>
                  <p style={{ ...S.caption, fontStyle: "italic" }}>
                    Despesa realizada: série consultada no SICONFI/FINBRA (código IBGE 3552205).
                  </p>
                  <TrackedExternalLink
                    href="https://siconfi.tesouro.gov.br/siconfi/pages/public/consulta_finbra/finbra_list.jsf"
                    area="camara-municipal"
                    label="SICONFI FINBRA"
                    style={{ ...S.mono, textDecoration: "underline", fontSize: "12px", whiteSpace: "nowrap" }}
                  >
                    SICONFI FINBRA
                  </TrackedExternalLink>
                </div>
              </div>
            </div>

            {/* Gráfico LOA série */}
            <div className="mb-12">
              <p className="uppercase font-semibold mb-4" style={S.label}>Evolução gráfica · fixado vs realizado</p>
              <SerieHistorica data={loaChartData} unit="mi" />
            </div>

            <div className="mb-12">
              <DadoQueMostra items={camaraInsights} />
            </div>

            {/* Devoluções à Prefeitura */}
            <div className="mb-12">
              <h2 style={{ ...S.h2, fontSize: "20px", marginBottom: "4px" }}>Devoluções de saldo à Prefeitura</h2>
              <p style={{ ...S.caption, marginBottom: "16px" }}>
                A Câmara pode devolver ao caixa municipal recursos do duodécimo não utilizados no exercício.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEVOLUCOES.map((d) => (
                  <div key={d.ano} className="p-5" style={{ border: "1px solid var(--border-01)" }}>
                    <p style={S.label} className="mb-2">{d.ano}</p>
                    <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", marginBottom: "6px" }}>
                      {formatMillions(d.valor)}
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--text-03)", lineHeight: "18px" }}>{d.nota}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4" style={S.caption}>
                Fonte: Jornal Cruzeiro dez/2021 e Agência de Notícias Sorocaba dez/2021.
              </p>
            </div>

            {/* Subsídios por legislatura */}
            <div className="mb-12">
              <h2 style={{ ...S.h2, fontSize: "20px", marginBottom: "4px" }}>Evolução dos subsídios por legislatura</h2>
              <p style={{ ...S.caption, marginBottom: "16px" }}>
                O subsídio é fixado no início de cada legislatura e vale para toda ela. A votação do reajuste ocorre na legislatura anterior.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SUBSIDIOS_LEGISLATURAS.map((leg) => (
                  <div key={leg.leg} className="p-6" style={{ border: "1px solid var(--border-01)", backgroundColor: leg.novo ? "var(--bg-elevated)" : "transparent" }}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <p style={{ ...S.label, color: leg.novo ? "var(--blue-40)" : "var(--text-04)" }}>{leg.leg}</p>
                      {leg.novo && <span style={{ fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--blue-40)", border: "1px solid var(--blue-60)", padding: "1px 5px" }}>Vigente</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p style={S.caption}>Vereadores</p>
                        <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{leg.vereadores}</p>
                      </div>
                      <div>
                        <p style={S.caption}>Subsídio bruto/mês</p>
                        <p className="font-mono" style={{ fontSize: "15px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                          {formatBRL(leg.subsidio)}
                        </p>
                        <p style={{ ...S.caption, marginTop: "2px" }}>
                          Pres.: {formatBRL(leg.presidente)}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-03)", lineHeight: "18px" }}>{leg.detalhe}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Assessores */}
            <div>
              <h2 style={{ ...S.h2, fontSize: "20px", marginBottom: "4px" }}>Quadro de servidores e assessores</h2>
              <p style={{ ...S.caption, marginBottom: "16px" }}>
                Assessores parlamentares (de livre nomeação) e servidores concursados. O limite por vereador foi reduzido pelo TCE-SP em 2024.
              </p>
              <div style={S.borderTop}>
                {ASSESSORES_SERIE.map((item) => (
                  <div key={item.ref} className="mobile-assessores-row grid grid-cols-[80px_1fr_1fr_2fr] items-start gap-6 py-4" style={S.borderBottom}>
                    <span className="font-mono font-semibold" style={{ fontSize: "13px", color: "var(--text-03)" }}>{item.ref}</span>
                    <div>
                      <p style={S.caption}>Servidores</p>
                      <p className="font-mono" style={{ fontSize: "15px", color: "var(--text-01)" }}>{item.servidores}</p>
                    </div>
                    <div>
                      <p style={S.caption}>Assessores/vereador</p>
                      <p className="font-mono" style={{ fontSize: "15px", color: "var(--text-01)" }}>{item.assessoresPorVer}</p>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-03)", lineHeight: "18px" }}>{item.nota}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Composição por partido */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-8" style={S.label}>Composição por partido · 19ª Legislatura</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={S.borderTop}>
              {partidosOrdenados.map(([partido, count], i) => {
                const pct = Math.round((count / vereadores.length) * 100)
                const col = i % 3
                return (
                  <div
                    key={partido}
                    className="mobile-indexed-cell py-5"
                    style={{
                      ...S.borderBottom,
                      paddingRight: col < 2 ? "48px" : "0",
                      borderLeft: col > 0 ? "1px solid var(--border-01)" : "none",
                      paddingLeft: col > 0 ? "48px" : "0",
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold" style={{ fontSize: "15px", color: "var(--text-01)" }}>{partido}</p>
                      <span className="font-mono" style={{ fontSize: "22px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                        {count}
                      </span>
                    </div>
                    <div className="mt-3" style={{ height: "3px", backgroundColor: "var(--border-01)", borderRadius: "2px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--blue-60)", borderRadius: "2px" }} />
                    </div>
                    <p className="mt-2" style={S.caption}>{pct}% · {count} {count === 1 ? "vereador" : "vereadores"}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Lista de vereadores */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
              <p className="uppercase font-semibold" style={S.label}>
                Vereadores · {vereadores.length} eleitos · mandato {vereadores[0]?.mandato ?? "2025-2028"}
              </p>
              <p style={S.caption}>Subsídio bruto mensal · fonte: {fonteSubsidios?.titulo}</p>
            </div>

            <div style={S.borderTop}>
              {vereadores
                .slice()
                .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                .map((v) => {
                  const isPresidente = v.remuneracao?.nota?.includes("Presidente")
                  return (
                    <div
                      key={v.nome}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 py-4 items-center"
                      style={S.borderBottom}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <p style={{ ...S.body, color: "var(--text-01)", fontWeight: 600 }}>{v.nome}</p>
                        {isPresidente && (
                          <span style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--blue-40)", border: "1px solid var(--blue-60)", padding: "1px 6px", whiteSpace: "nowrap" }}>
                            Presidente
                          </span>
                        )}
                      </div>
                      <p style={{ ...S.body, color: "var(--text-03)" }}>{v.partido}</p>
                      <p className="font-mono" style={{ fontSize: "14px", color: "var(--text-02)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {formatBRL(v.remuneracao?.valor_bruto_mensal ?? 0)}/mês
                      </p>
                    </div>
                  )
                })}
            </div>

            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <p style={S.caption}>Total subsídios/mês: {formatBRL(totalMensalSubsidios)} · Total anual: {formatBRL(totalAnualSubsidios)}</p>
            </div>
          </div>
        </section>

        {/* Despesas TCE · execução contábil */}
        {tceRows.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Execução contábil · TCE-SP</p>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "8px" }}>
                Despesas da Câmara Municipal declaradas ao TCE-SP, por ano e evento contábil
                (Empenhado, Liquidado, Pago), 2020–2026.
                Total de {tceRows.reduce((s, r) => s + r.count, 0).toLocaleString("pt-BR")} registros.
              </p>
              <p style={{ ...S.caption, marginBottom: "24px" }}>
                Fonte: TCE-SP — dados de execução orçamentária declarados pela Câmara Municipal
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                  <thead>
                    <tr style={S.borderBottom}>
                      <th style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-04)", fontWeight: 600, padding: "10px 12px", textAlign: "left" }}>Ano</th>
                      <th style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-04)", fontWeight: 600, padding: "10px 12px", textAlign: "left" }}>Evento</th>
                      <th style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-04)", fontWeight: 600, padding: "10px 12px", textAlign: "right" }}>Registros</th>
                      <th style={{ fontSize: "11px", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-04)", fontWeight: 600, padding: "10px 12px", textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tceRows.map((r) => (
                      <tr key={`${r.ano}-${r.evento}`} style={S.borderBottom}>
                        <td style={{ fontSize: "14px", color: "var(--text-01)", padding: "10px 12px", fontWeight: 500 }}>{r.ano}</td>
                        <td style={{ fontSize: "14px", color: "var(--text-02)", padding: "10px 12px" }}>{r.evento}</td>
                        <td style={{ fontSize: "14px", color: "var(--text-02)", padding: "10px 12px", textAlign: "right" }}>
                          {r.count.toLocaleString("pt-BR")}
                        </td>
                        <td style={{ fontSize: "14px", color: "var(--text-02)", padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-ibm-plex-mono)" }}>
                          {formatMillions(r.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Produção legislativa */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              <div className="py-8 md:pr-12" style={S.borderBottom}>
                <h2 style={S.h2}>Produção legislativa</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O sistema legislativo eletrônico da Câmara de Sorocaba é público. É possível consultar
                  projetos de lei apresentados, votações e tramitações por autor e por ano diretamente
                  no portal oficial.
                </p>
                <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                  Ainda não extraímos esses dados em formato estruturado para exibir aqui. A integração
                  está em planejamento.
                </p>
                <TrackedExternalLink
                  href="https://sorocaba.camarasempapel.com.br/spl/consulta-producao.aspx"
                  area="camara-municipal"
                  label="Sistema legislativo eletrônico"
                  style={{ ...S.mono, textDecoration: "underline" }}
                >
                  sorocaba.camarasempapel.com.br
                </TrackedExternalLink>
              </div>
              <div className="mobile-indexed-cell py-8 md:pl-12" style={{ borderLeft: "1px solid var(--border-01)", ...S.borderBottom }}>
                <h2 style={S.h2}>O que ainda não está mapeado</h2>
                <ul className="flex flex-col gap-3">
                  {AUSENCIAS.map((item) => (
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

        {/* Fontes */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Fontes declaradas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0" style={S.borderTop}>
              {[
                fonteCamara && {
                  titulo: fonteCamara.titulo,
                  url: fonteCamara.url,
                  nota: "Lista oficial dos 25 vereadores empossados",
                },
                fonteSubsidios && {
                  titulo: fonteSubsidios.titulo,
                  url: fonteSubsidios.url,
                  nota: "Subsídios vigentes publicados em jan/2026",
                },
                {
                  titulo: "LOAs 2020–2025 · Prefeitura de Sorocaba (PDFs oficiais)",
                  url: "https://www.sorocaba.sp.gov.br/transparencia/prestacao-de-contas/lei-orcamentaria-anual/",
                  nota: "Fonte oficial — LOA fixada para a Câmara (Função Legislativa): 2020 R$60,2mi · 2021 R$59,9mi · 2022 R$69,2mi · 2023 R$78,9mi · 2024 R$88,5mi · 2025 R$96,4mi",
                },
                {
                  titulo: "SICONFI — RREO Anexo 02 · Tesouro Nacional",
                  url: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=3552205&no_anexo=RREO-Anexo%2002",
                  nota: "Fonte oficial — despesa liquidada da função Legislativa 2020–2026 via API pública SICONFI (IBGE 3552205). Inclui parcelas exceto e intra-orçamentárias.",
                },
                {
                  titulo: "Jornal Cruzeiro — reajuste de subsídios aprovado em 10 segundos",
                  url: "https://www.jornalcruzeiro.com.br/sorocaba/noticias/2023/04/712655-camara-de-sorocaba-aprova-aumento-do-salario-dos-vereadores-em-menos-de-10-segundos.html",
                  nota: "Imprensa (abr/2023) — fato citado: aprovação do reajuste +52,95% para a 19ª Legislatura durou menos de 10 segundos",
                },
                {
                  titulo: "Jornal Cruzeiro — devolução de R$ 11,5 mi à Prefeitura",
                  url: "https://www.jornalcruzeiro.com.br/sorocaba/noticias/2021/12/685459-camara-devolve-rs-115-mi-para-prefeitura-de-sorocaba.html",
                  nota: "Imprensa (dez/2021) — devoluções de saldo: R$ 5 mi em 2020 e R$ 11,5 mi em 2021",
                },
                {
                  titulo: "Jornal Cruzeiro — custos de pessoal 2025",
                  url: "https://www.jornalcruzeiro.com.br/sorocaba/noticias/2025/06/749105-de-onde-vem-o-dinheiro-das-camaras-municipais.html",
                  nota: "Imprensa (jun/2025) — assessores parlamentares e verba de gabinete; informação atribuída pela reportagem à Câmara",
                },
              ].filter(Boolean).map((fonte, i) => {
                const col = i % 3
                return (
                  <div
                    key={fonte!.titulo}
                    className="mobile-indexed-cell py-6"
                    style={{
                      ...S.borderBottom,
                      paddingRight: col < 2 ? "32px" : "0",
                      borderLeft: col > 0 ? "1px solid var(--border-01)" : "none",
                      paddingLeft: col > 0 ? "32px" : "0",
                    }}
                  >
                    <p style={{ ...S.body, color: "var(--text-01)", fontWeight: 600, marginBottom: "4px", fontSize: "14px" }}>
                      {fonte!.titulo}
                    </p>
                    <p style={{ ...S.caption, marginBottom: "8px" }}>{fonte!.nota}</p>
                    <TrackedExternalLink
                      href={fonte!.url}
                      area="camara-municipal"
                      label={fonte!.titulo}
                      style={{ ...S.mono, textDecoration: "underline", wordBreak: "break-all", fontSize: "12px" }}
                    >
                      {fonte!.url.replace("https://", "").slice(0, 60)}{fonte!.url.length > 68 ? "…" : ""}
                    </TrackedExternalLink>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/" className="nav-link">← Voltar para o painel</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
            <Link href="/contato" className="nav-link">Reportar erro ou contribuir</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
