import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"
import {
  getAvailableYearsReceita,
  loadReceitaMunicipal,
  type ReceitaMunicipalRow,
} from "@/lib/data"
import { AnoSelector } from "@/components/ui/ano-selector"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { SerieHistorica, type SerieHistoricaPoint } from "@/components/charts/SerieHistorica"
import { DonutFuncoes, type DonutPoint } from "@/components/charts/DonutFuncoes"

export const metadata: Metadata = {
  title: "Receita Municipal de Sorocaba",
  description:
    "De onde vêm os recursos de Sorocaba: impostos, transferências da União, dos estados e outras fontes. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/receita" },
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

// Categorias exibidas na tabela principal (não mostra linhas de controle/subtotais)
const COD_DISPLAY_ORDER = [
  "ReceitaTributaria",
  "Impostos",
  "Taxas",
  "ContribuicaoDeMelhoria",
  "ReceitaDeContribuicoes",
  "ReceitaPatrimonial",
  "ReceitaDeServicos",
  "TransferenciasCorrentes",
  "TransferenciasCorrentesDaUniaoEDeSuasEntidades",
  "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades",
  "TransferenciasCorrentesDeOutrasInstituicoesPublicas",
  "OutrasReceitasCorrentes",
  "ReceitasDeCapital",
  "ReceitasIntraOrcamentariasTotal",
]

// Itens que são sub-linhas (recuam na tabela)
const SUBITEMS = new Set([
  "Impostos",
  "Taxas",
  "ContribuicaoDeMelhoria",
  "TransferenciasCorrentesDaUniaoEDeSuasEntidades",
  "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades",
  "TransferenciasCorrentesDeOutrasInstituicoesPublicas",
])

const DONUT_PALETTE = ["#0f62fe", "#4589ff", "#78a9ff", "#a6c8ff", "#6f6f6f", "#78a9ff", "#525252"]

function fmt(value: number): string {
  if (value >= 1e9) {
    return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  }
  if (value >= 1e6) {
    return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function byCode(rows: ReceitaMunicipalRow[], cod: string): ReceitaMunicipalRow | undefined {
  return rows.find((r) => r.cod_conta === cod)
}

function val(rows: ReceitaMunicipalRow[], cod: string): number {
  return byCode(rows, cod)?.arrecadado_acumulado ?? 0
}

interface SerieAnual {
  ano: number
  total: number
  correntes: number
  tributaria: number
  transferencias: number
  capital: number
}

function buildSerie(anos: number[]): SerieAnual[] {
  return anos
    .map((ano) => {
      const rows = loadReceitaMunicipal(ano)
      return {
        ano,
        total:          val(rows, "TotalReceitas"),
        correntes:      val(rows, "ReceitasCorrentes"),
        tributaria:     val(rows, "ReceitaTributaria"),
        transferencias: val(rows, "TransferenciasCorrentes"),
        capital:        val(rows, "ReceitasDeCapital"),
      }
    })
    .sort((a, b) => b.ano - a.ano)
}

export default async function ReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const params = await searchParams
  const anos = getAvailableYearsReceita()
  const anoParam = params.ano && /^\d{4}$/.test(params.ano) ? parseInt(params.ano) : null
  const anoFeatured = anoParam && anos.includes(anoParam) ? anoParam : (anos[0] ?? 2025)

  const dados = loadReceitaMunicipal(anoFeatured)
  const serie = buildSerie(anos)

  const totalArrecadado    = val(dados, "TotalReceitas")
  const excetoIntra        = val(dados, "ReceitasExcetoIntraOrcamentarias")
  const correntes          = val(dados, "ReceitasCorrentes")
  const tributaria         = val(dados, "ReceitaTributaria")
  const transferencias     = val(dados, "TransferenciasCorrentes")
  const capital            = val(dados, "ReceitasDeCapital")
  const intra              = val(dados, "ReceitasIntraOrcamentariasTotal")
  const previsto           = byCode(dados, "TotalReceitas")?.previsto_inicial ?? 0

  const pctTrib       = correntes > 0 ? (tributaria     / correntes * 100) : 0
  const pctTransf     = correntes > 0 ? (transferencias / correntes * 100) : 0
  const execPrevisto  = previsto > 0   ? (totalArrecadado / previsto * 100) : null

  // Série histórica para o gráfico (fixado = previsto_inicial, liquidado = arrecadado_acumulado)
  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano:       String(s.ano),
    fixado:    0, // usaremos apenas uma barra (arrecadado)
    liquidado: s.total,
  }))

  // Donut — composição das receitas correntes exceto intra
  const impostos    = val(dados, "Impostos")
  const taxas       = val(dados, "Taxas")
  const contribuic  = val(dados, "ReceitaDeContribuicoes")
  const patrimonial = val(dados, "ReceitaPatrimonial")
  const servicos    = val(dados, "ReceitaDeServicos")
  const outrasCorr  = val(dados, "OutrasReceitasCorrentes")
  const uniaoTr     = val(dados, "TransferenciasCorrentesDaUniaoEDeSuasEntidades")
  const estadosTr   = val(dados, "TransferenciasCorrentesDosEstadosEDoDistritoFederalEDeSuasEntidades")
  const outrasTr    = val(dados, "TransferenciasCorrentesDeOutrasInstituicoesPublicas")

  const donutData: DonutPoint[] = [
    { nome: "Impostos",              valor: impostos,    color: DONUT_PALETTE[0]! },
    { nome: "Transf. Estados",       valor: estadosTr,   color: DONUT_PALETTE[1]! },
    { nome: "Transf. Outras Inst.",  valor: outrasTr,    color: DONUT_PALETTE[2]! },
    { nome: "Transf. União",         valor: uniaoTr,     color: DONUT_PALETTE[3]! },
    { nome: "Contribuições",         valor: contribuic,  color: DONUT_PALETTE[4]! },
    { nome: "Patrimonial",           valor: patrimonial, color: DONUT_PALETTE[5]! },
    { nome: "Outras",                valor: taxas + servicos + outrasCorr + capital, color: DONUT_PALETTE[6]! },
  ].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor)

  // "E daí?" insights
  const anoAnterior = serie.find((s) => s.ano === anoFeatured - 1)
  const s2020       = serie.find((s) => s.ano === 2020)
  const yoyChange   = anoAnterior && anoAnterior.total > 0
    ? ((totalArrecadado - anoAnterior.total) / anoAnterior.total * 100) : null
  const growthSerie = s2020 && s2020.total > 0 && anoFeatured > 2020
    ? ((totalArrecadado - s2020.total) / s2020.total * 100) : null
  const depTransf   = excetoIntra > 0 ? (transferencias / excetoIntra * 100) : 0
  const depTrib     = excetoIntra > 0 ? (tributaria     / excetoIntra * 100) : 0

  const insights: string[] = [
    ...(yoyChange !== null
      ? [`A receita total ${yoyChange >= 0 ? "cresceu" : "recuou"} ${Math.abs(yoyChange).toFixed(1)}% em relação a ${anoFeatured - 1} (de ${fmt(anoAnterior!.total)} para ${fmt(totalArrecadado)}).`]
      : []),
    ...(growthSerie !== null
      ? [`Entre 2020 e ${anoFeatured}, a receita total acumulou +${growthSerie.toFixed(0)}% — passando de ${fmt(s2020!.total)} para ${fmt(totalArrecadado)}.`]
      : []),
    `As transferências intergovernamentais representam ${depTransf.toFixed(1)}% das receitas exceto intra-orçamentárias — incluindo cota-parte do ICMS, FPM, FUNDEB e outros repasses.`,
    `Receita tributária própria (impostos, taxas e contribuição de melhoria) representa ${depTrib.toFixed(1)}% das receitas exceto intra-orçamentárias, indicando capacidade fiscal própria do município.`,
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
                <p className="uppercase font-semibold" style={S.label}>Receita Municipal · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoFeatured}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                De onde vêm os recursos do município
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Em {anoFeatured}, Sorocaba arrecadou{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(totalArrecadado)}</strong> no total —
                sendo{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(excetoIntra)}</strong> em receitas exceto
                intra-orçamentárias. A receita tributária própria somou{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(tributaria)}</strong>{" "}
                ({pctTrib.toFixed(1)}% das receitas correntes) e as transferências
                intergovernamentais somaram{" "}
                <strong style={{ color: "var(--text-01)" }}>{fmt(transferencias)}</strong>{" "}
                ({pctTransf.toFixed(1)}%).
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Os dados são do RREO Anexo 01 (Balanço Orçamentário — Receitas), que consolida
                todas as fontes de arrecadação do município ao longo do exercício. O valor de referência
                é o arrecadado acumulado até o 6º bimestre (encerramento do ano).
              </p>
              <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01 · 6º bimestre · IBGE 3552205</p>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: `Total arrecadado ${anoFeatured}`, valor: fmt(totalArrecadado),  nota: "Inclui receitas intra-orçamentárias" },
                { label: "Receita tributária própria",       valor: fmt(tributaria),       nota: `${pctTrib.toFixed(1)}% das receitas correntes` },
                { label: "Transferências correntes",         valor: fmt(transferencias),   nota: `${pctTransf.toFixed(1)}% das receitas correntes` },
                { label: "% do previsto arrecadado",         valor: execPrevisto !== null ? `${execPrevisto.toFixed(1)}%` : "—", nota: "Arrecadado ÷ previsto (LOA)" },
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
              <AnoSelector anos={anos} selectedAno={anoFeatured} basePath="/receita" />
            </div>
          </div>
        </section>

        {/* Composição — donut + tabela */}
        <section id="composicao" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Composição {anoFeatured}</p>
                <h2 style={S.h2}>De onde vêm as receitas</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O gráfico ao lado mostra a composição da receita corrente de Sorocaba em {anoFeatured}.
                  Municípios brasileiros dependem fortemente de transferências estaduais (cota-parte do ICMS
                  e IPVA) e de outras instituições públicas (FUNDEB, repasses do SUS, etc.).
                </p>
                <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                  A receita tributária própria (impostos municipais como ISS, IPTU e ITBI, além de taxas)
                  mede a capacidade fiscal autônoma do município — quanto maior, menos dependente
                  de repasses externos.
                </p>
                <div className="p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.caption, lineHeight: "18px" }}>
                    <strong style={{ color: "var(--text-02)" }}>Nota sobre Intra-Orçamentárias:</strong>{" "}
                    {fmt(intra)} são receitas intra-orçamentárias — contribuições previdenciárias dos servidores
                    ao RPPS. São computadas à parte por representar circulação interna entre órgãos do mesmo ente.
                  </p>
                </div>
              </div>

              {/* Donut */}
              <div style={{ minHeight: "320px" }}>
                <DonutFuncoes data={donutData} />
              </div>
            </div>
          </div>
        </section>

        {/* Tabela detalhada */}
        <section id="detalhamento" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Detalhamento {anoFeatured}</p>
            <h2 style={S.h2}>Receitas por categoria</h2>
            <p style={{ ...S.body, marginBottom: "24px", maxWidth: "640px" }}>
              Todas as categorias do RREO Anexo 01 — previsto (LOA inicial), previsto atualizado e arrecadado
              acumulado até o 6º bimestre.
            </p>

            {/* Cabeçalho */}
            <div className="hidden md:grid py-2 mb-1"
              style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px", borderBottom: "1px solid var(--border-02)" }}>
              <span style={S.label}>Categoria</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Previsto inicial</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Previsto atualizado</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Arrecadado</span>
            </div>

            {/* Linha de total */}
            <div className="py-4 grid"
              style={{ gridTemplateColumns: "1fr", borderBottom: "2px solid var(--border-02)", backgroundColor: "var(--bg-raised)" }}>
              <div className="md:grid px-2"
                style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-01)" }}>
                  Total de Receitas
                </span>
                <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-03)", textAlign: "right", minWidth: "130px" }}>
                  {fmt(byCode(dados, "TotalReceitas")?.previsto_inicial ?? 0)}
                </span>
                <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-03)", textAlign: "right", minWidth: "130px" }}>
                  {fmt(byCode(dados, "TotalReceitas")?.previsto_atualizado ?? 0)}
                </span>
                <span className="font-mono" style={{ fontSize: "14px", color: "var(--text-01)", fontWeight: 600, textAlign: "right", minWidth: "130px" }}>
                  {fmt(totalArrecadado)}
                </span>
              </div>
            </div>

            {/* Exceto intra */}
            <div className="py-3 md:grid px-2"
              style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px", borderBottom: "1px solid var(--border-01)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-02)", fontWeight: 500 }}>
                Exceto Intra-Orçamentárias
              </span>
              <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>
                {fmt(byCode(dados, "ReceitasExcetoIntraOrcamentarias")?.previsto_inicial ?? 0)}
              </span>
              <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>
                {fmt(byCode(dados, "ReceitasExcetoIntraOrcamentarias")?.previsto_atualizado ?? 0)}
              </span>
              <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-02)", fontWeight: 500, textAlign: "right", minWidth: "130px" }}>
                {fmt(excetoIntra)}
              </span>
            </div>

            {/* Receitas Correntes */}
            <div className="py-3 md:grid px-2"
              style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px", borderBottom: "1px solid var(--border-01)" }}>
              <span style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 500 }}>
                Receitas Correntes
              </span>
              <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-03)", textAlign: "right", minWidth: "130px" }}>
                {fmt(byCode(dados, "ReceitasCorrentes")?.previsto_inicial ?? 0)}
              </span>
              <span className="hidden md:block font-mono" style={{ fontSize: "13px", color: "var(--text-03)", textAlign: "right", minWidth: "130px" }}>
                {fmt(byCode(dados, "ReceitasCorrentes")?.previsto_atualizado ?? 0)}
              </span>
              <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 500, textAlign: "right", minWidth: "130px" }}>
                {fmt(correntes)}
              </span>
            </div>

            {/* Linhas individuais */}
            {COD_DISPLAY_ORDER.map((cod) => {
              const row = byCode(dados, cod)
              if (!row) return null
              const isSub   = SUBITEMS.has(cod)
              const isTotal = cod === "ReceitaTributaria" || cod === "TransferenciasCorrentes"
              const arrecadado = row.arrecadado_acumulado
              const pct = excetoIntra > 0 ? (arrecadado / excetoIntra * 100) : 0
              return (
                <div key={cod}
                  className="py-3 md:grid"
                  style={{
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: "16px",
                    borderBottom: "1px solid var(--border-01)",
                    paddingLeft: isSub ? "24px" : "8px",
                    paddingRight: "8px",
                    backgroundColor: isTotal ? "var(--bg-base)" : "transparent",
                  }}>
                  <div>
                    <span style={{
                      fontSize: isSub ? "12px" : "13px",
                      color: isSub ? "var(--text-03)" : "var(--text-02)",
                      fontWeight: isTotal ? 500 : 400,
                    }}>
                      {isSub && <span style={{ color: "var(--text-04)", marginRight: "6px" }}>↳</span>}
                      {row.categoria}
                    </span>
                    {!isSub && (
                      <span className="ml-2" style={{ fontSize: "11px", color: "var(--text-04)" }}>
                        {pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block font-mono" style={{ fontSize: "12px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>
                    {fmt(row.previsto_inicial)}
                  </span>
                  <span className="hidden md:block font-mono" style={{ fontSize: "12px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>
                    {fmt(row.previsto_atualizado)}
                  </span>
                  <span className="font-mono" style={{
                    fontSize: isSub ? "12px" : "13px",
                    color: isSub ? "var(--text-03)" : "var(--text-01)",
                    fontWeight: isTotal ? 500 : 400,
                    textAlign: "right",
                    minWidth: "130px",
                  }}>
                    {fmt(arrecadado)}
                  </span>
                </div>
              )
            })}

            <p className="mt-6" style={S.caption}>
              Valores em reais. Arrecadado = acumulado até o 6º bimestre (RREO-Anexo 01).
              Intra-orçamentárias = contribuições previdenciárias ao RPPS (circulação interna).
            </p>
          </div>
        </section>

        {/* Série histórica */}
        <section id="serie" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Série histórica 2020–{anoFeatured}</p>
                <h2 style={S.h2}>Evolução da receita municipal</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  Evolução da receita total arrecadada de 2020 a {anoFeatured}. O crescimento é influenciado
                  pela inflação, pelo aumento da base tributária municipal (crescimento econômico) e pela
                  variação dos repasses federais e estaduais.
                </p>

                {/* Mini-tabela de série */}
                <div style={{ ...S.borderTop }}>
                  {serieOrdenada.map((s) => (
                    <div key={s.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: s.ano === anoFeatured ? "var(--blue-40)" : "var(--text-03)", fontWeight: s.ano === anoFeatured ? 600 : 400 }}>
                        {s.ano}
                      </span>
                      <div className="flex items-center gap-6">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          trib. {fmt(s.tributaria)}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          transf. {fmt(s.transferencias)}
                        </span>
                        <span className="font-mono" style={{ fontSize: "13px", color: s.ano === anoFeatured ? "var(--text-01)" : "var(--text-02)", fontWeight: s.ano === anoFeatured ? 600 : 400, minWidth: "80px", textAlign: "right" }}>
                          {fmt(s.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <DadoQueMostra items={insights} />
              </div>

              <div style={{ minHeight: "300px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Total arrecadado por ano (R$ bilhões)</p>
                <SerieHistorica data={serieChartData} unit="bi" />
                <p className="mt-2" style={S.caption}>
                  A barra &ldquo;fixado&rdquo; é omitida neste gráfico pois apenas o arrecadado é relevante para receita.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contexto e metodologia */}
        <section id="metodologia" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>O que é o RREO Anexo 01</p>
                <p style={S.body}>
                  O Relatório Resumido da Execução Orçamentária (RREO) é publicado bimestralmente por todos
                  os municípios brasileiros. O Anexo 01 — Balanço Orçamentário das Receitas — detalha todas
                  as fontes de arrecadação planejadas e realizadas no período.
                </p>
              </div>

              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Receitas próprias vs. transferências</p>
                <p style={S.body}>
                  Municípios brasileiros arrecadam diretamente ISS (serviços), IPTU (propriedade), ITBI
                  (transmissão de imóveis) e taxas. Mas a maior parte da receita geralmente vem de
                  transferências: FPM (cota federal), ICMS e IPVA (cota estadual), FUNDEB e repasses
                  do SUS pelo governo federal.
                </p>
              </div>

              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fonte dos dados</p>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  Os dados são extraídos automaticamente da API pública do SICONFI (Sistema de
                  Informações Contábeis e Fiscais) do Tesouro Nacional. Período: 6º bimestre de
                  cada ano (encerramento do exercício).
                </p>
                <TrackedExternalLink
                  href="https://siconfi.tesouro.gov.br"
                  area="receita"
                  label="siconfi"
                  style={{ fontSize: "13px", color: "var(--blue-40)" }}
                >
                  → siconfi.tesouro.gov.br
                </TrackedExternalLink>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
