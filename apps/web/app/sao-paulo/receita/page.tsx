import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import Link from "next/link"
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
import { datasetSchema, breadcrumbSchema, SITE_URL } from "@/lib/structured-data"

const SP_REC_DATASET = datasetSchema({
  name: "Receitas municipais — São Paulo 2020–2025",
  description: "Receitas do Município de São Paulo por categoria e espécie (RREO Anexo 01/SICONFI): impostos próprios (ISS, IPTU, ITBI), transferências da União (FPM, IR, IPI), ICMS/IPVA estaduais e demais fontes. IBGE 3550308.",
  url: `${SITE_URL}/sao-paulo/receita`,
  temporalCoverage: "2020/2025",
  spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
  keywords: ["receitas São Paulo", "ISS", "IPTU", "FPM", "ICMS", "RREO", "arrecadação municipal"],
  dateModified: "2026-06-20",
  downloadUrls: [
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2020.csv`,
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2021.csv`,
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2022.csv`,
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2023.csv`,
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2024.csv`,
    `${SITE_URL}/api/dados/sao_paulo/receita/saida/receitas_sao_paulo_2025.csv`,
  ],
})



const SP_RECEITA_BREADCRUMB = breadcrumbSchema([
  { name: "Início", url: "https://www.anatomiadogasto.ong.br" },
  { name: "São Paulo", url: "https://www.anatomiadogasto.ong.br/sao-paulo" },
  { name: "Receitas municipais" },
])
const MUNICIPIO = "sao_paulo"
const IBGE = "3550308"

export const metadata: Metadata = {
  title: "Receita Municipal de São Paulo",
  description:
    "De onde vêm os recursos de São Paulo: impostos próprios (ISS, IPTU), ICMS/IPVA estaduais e transferências federais. Série histórica 2020–2025. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sao-paulo/receita" },
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
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function byCode(rows: ReceitaMunicipalRow[], cod: string): ReceitaMunicipalRow | undefined {
  return rows.find((r) => r.cod_conta === cod)
}

function val(rows: ReceitaMunicipalRow[], cod: string): number {
  return byCode(rows, cod)?.arrecadado_acumulado ?? 0
}

interface SerieAnual { ano: number; total: number; correntes: number; tributaria: number; transferencias: number; capital: number }

function buildSerie(anos: number[]): SerieAnual[] {
  return anos
    .map((ano) => {
      const rows = loadReceitaMunicipal(ano, MUNICIPIO)
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

export default async function SaoPauloReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const params = await searchParams
  const anos = getAvailableYearsReceita(MUNICIPIO)
  const anoParam = params.ano && /^\d{4}$/.test(params.ano) ? parseInt(params.ano) : null
  const anoFeatured = anoParam && anos.includes(anoParam) ? anoParam : (anos[0] ?? 2025)

  const dados = loadReceitaMunicipal(anoFeatured, MUNICIPIO)
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

  const serieOrdenada = serie.slice().sort((a, b) => a.ano - b.ano)
  const serieChartData: SerieHistoricaPoint[] = serieOrdenada.map((s) => ({
    ano: String(s.ano),
    fixado: 0,
    liquidado: s.total,
  }))

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
    { nome: "Patrimonial",           valor: patrimonial, color: DONUT_PALETTE[4]! },
    { nome: "Contribuições",         valor: contribuic,  color: DONUT_PALETTE[5]! },
    { nome: "Outras",                valor: taxas + servicos + outrasCorr + capital, color: DONUT_PALETTE[6]! },
  ].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor)

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
    `As transferências intergovernamentais representam ${depTransf.toFixed(1)}% das receitas exceto intra-orçamentárias — inclui a cota-parte do ICMS e do FPM repassada ao município.`,
    `Receita tributária própria (impostos, taxas) representa ${depTrib.toFixed(1)}% das receitas exceto intra-orçamentárias.`,
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SP_REC_DATASET) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SP_RECEITA_BREADCRUMB) }} />
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div className="mobile-hero-inset" style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="uppercase font-semibold" style={S.label}>Receita Municipal · São Paulo/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoFeatured}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                De onde vêm os recursos do município
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                Em {anoFeatured}, São Paulo arrecadou{" "}
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
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "12px" }}>
                São Paulo é o maior município do Brasil e detém o maior orçamento municipal do país.
                Sua arrecadação própria é puxada principalmente pelo ISS (imposto sobre serviços) e pelo
                IPTU, complementada pelas transferências da União e do Estado de SP.
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Os dados são do RREO Anexo 01 (Balanço Orçamentário — Receitas). O valor de referência
                é o arrecadado acumulado até o 6º bimestre (encerramento do ano).
              </p>
              <p style={S.caption}>Fonte: SICONFI/Tesouro Nacional — RREO Anexo 01 · 6º bimestre · IBGE {IBGE}</p>
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
              <AnoSelector anos={anos} selectedAno={anoFeatured} basePath="/sao-paulo/receita" />
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
                  O gráfico mostra a composição da receita corrente de São Paulo em {anoFeatured}.
                  Combina arrecadação tributária própria (com destaque para ISS e IPTU) e
                  transferências correntes da União e do Estado de SP.
                </p>
                <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                  A composição exata por categoria está detalhada na tabela abaixo, extraída
                  diretamente do RREO Anexo 01 publicado no SICONFI.
                </p>
                <div className="p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.caption, lineHeight: "18px" }}>
                    <strong style={{ color: "var(--text-02)" }}>Nota sobre Intra-Orçamentárias:</strong>{" "}
                    {fmt(intra)} são receitas intra-orçamentárias — contribuições previdenciárias dos servidores
                    ao RPPS municipal. São computadas à parte por representar circulação interna.
                  </p>
                </div>
              </div>
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

            <div className="hidden md:grid py-2 mb-1"
              style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px", borderBottom: "1px solid var(--border-02)" }}>
              <span style={S.label}>Categoria</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Previsto inicial</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Previsto atualizado</span>
              <span style={{ ...S.label, textAlign: "right", minWidth: "130px" }}>Arrecadado</span>
            </div>

            <div className="py-4 grid"
              style={{ gridTemplateColumns: "1fr", borderBottom: "2px solid var(--border-02)", backgroundColor: "var(--bg-raised)" }}>
              <div className="md:grid px-2" style={{ gridTemplateColumns: "1fr auto auto auto", gap: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-01)" }}>Total de Receitas</span>
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
                    <span style={{ fontSize: isSub ? "12px" : "13px", color: isSub ? "var(--text-03)" : "var(--text-02)", fontWeight: isTotal ? 500 : 400 }}>
                      {isSub && <span style={{ color: "var(--text-04)", marginRight: "6px" }}>↳</span>}
                      {row.categoria}
                    </span>
                    {!isSub && <span className="ml-2" style={{ fontSize: "11px", color: "var(--text-04)" }}>{pct.toFixed(1)}%</span>}
                  </div>
                  <span className="hidden md:block font-mono" style={{ fontSize: "12px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>{fmt(row.previsto_inicial)}</span>
                  <span className="hidden md:block font-mono" style={{ fontSize: "12px", color: "var(--text-04)", textAlign: "right", minWidth: "130px" }}>{fmt(row.previsto_atualizado)}</span>
                  <span className="font-mono" style={{ fontSize: isSub ? "12px" : "13px", color: isSub ? "var(--text-03)" : "var(--text-01)", fontWeight: isTotal ? 500 : 400, textAlign: "right", minWidth: "130px" }}>
                    {fmt(arrecadado)}
                  </span>
                </div>
              )
            })}
            <p className="mt-6" style={S.caption}>
              Valores em reais. Arrecadado = acumulado até o 6º bimestre (RREO-Anexo 01).
              Intra-orçamentárias = contribuições previdenciárias ao RPPS.
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
                <div style={S.borderTop}>
                  {serieOrdenada.map((s) => (
                    <div key={s.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: s.ano === anoFeatured ? "var(--blue-40)" : "var(--text-03)", fontWeight: s.ano === anoFeatured ? 600 : 400 }}>
                        {s.ano}
                      </span>
                      <div className="flex items-center gap-6">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>trib. {fmt(s.tributaria)}</span>
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>transf. {fmt(s.transferencias)}</span>
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
              </div>
            </div>
          </div>
        </section>

        {/* Metodologia */}
        <section id="metodologia" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>O que é o RREO Anexo 01</p>
                <p style={S.body}>
                  O Relatório Resumido da Execução Orçamentária (RREO) é publicado bimestralmente.
                  O Anexo 01 detalha todas as fontes de arrecadação planejadas e realizadas no período.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Maior município do Brasil</p>
                <p style={S.body}>
                  São Paulo concentra o maior orçamento municipal do país. A arrecadação própria é
                  sustentada por uma ampla base de ISS (serviços) e IPTU, complementada pelas
                  transferências constitucionais da União (FPM) e do Estado de SP (cota-parte do ICMS).
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Fonte dos dados</p>
                <p style={{ ...S.body, marginBottom: "12px" }}>
                  Os dados são extraídos da API pública do SICONFI (Tesouro Nacional). Período: 6º bimestre de
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

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/sao-paulo" className="nav-link">← São Paulo</Link>
            <Link href="/sao-paulo/executivo" className="nav-link">Orçamento total</Link>
            <Link href="/sao-paulo/saude-fiscal" className="nav-link">Saúde fiscal</Link>
            <Link href="/sao-paulo/seguranca" className="nav-link">Segurança</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
