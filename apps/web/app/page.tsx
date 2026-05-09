import React from "react"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getPoderPublicoSorocaba } from "@/lib/agentes"
import {
  FUNCAO_LABELS,
  SUBFUNCAO_LABELS,
  TOTAL_ROW,
  formatMillions,
  getAvailableYears,
  getAvailableYearsSeguranca,
  getAvailableYearsTransporte,
  loadRevenueData,
  loadSegurancaData,
  loadTransporteDca,
  loadTransporteOrcamento,
  loadYearData,
  type HealthArea,
  type HealthRow,
} from "@/lib/data"

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 700,
    textTransform: "uppercase",
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
}

const HEALTH_AREAS: { area: HealthArea; titulo: string; href: string }[] = [
  { area: "saude", titulo: "Saúde", href: "/saude" },
  { area: "educacao", titulo: "Educação", href: "/educacao" },
]

const SEGURANCA_TOTAL = "06 - Segurança Pública"

const EXPLICACOES = [
  {
    titulo: "De onde vem",
    texto: "Impostos próprios, transferências do Estado, transferências da União e, em Saúde, repasses SUS.",
  },
  {
    titulo: "Quanto a lei exige",
    texto: "Saúde tem mínimo constitucional de 15%. Educação tem mínimo constitucional de 25%.",
  },
  {
    titulo: "Em que fase está",
    texto: "O site separa dotação autorizada, valor empenhado, valor liquidado e valor efetivamente pago.",
  },
  {
    titulo: "Para onde foi",
    texto: "Os dados mostram funções e subfunções visíveis na fonte oficial publicada para cada área.",
  },
]

const LIMITES = [
  "Fornecedor, CNPJ, contrato e nota fiscal individual.",
  "Escola, UBS, hospital, endereço ou unidade executora detalhada.",
  "Conta bancária, comprovante de pagamento e pessoa responsável por cada ato.",
]

function formatPercent(value?: number): string {
  if (value === undefined) return "sem dado"
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function latestPeriodRows(rows: HealthRow[]): HealthRow[] {
  const latestPeriod = Math.max(...rows.map((row) => row.quadrimestre))
  return rows.filter((row) => row.quadrimestre === latestPeriod)
}

function getAreaSummary(area: HealthArea) {
  const years = getAvailableYears(area)
  const latestYear = years[0]
  const rows = latestYear ? latestPeriodRows(loadYearData(latestYear, area)) : []
  const revenues = latestYear ? loadRevenueData(latestYear, area) : []
  const latestRevenue = revenues.sort((a, b) => b.quadrimestre - a.quadrimestre)[0]
  const total = rows.find((row) => row.funcao === TOTAL_ROW[area])
  const funcoes = rows.filter((row) => row.funcao !== TOTAL_ROW[area])

  return {
    latestYear,
    period: rows[0]?.quadrimestre,
    years,
    total,
    latestRevenue,
    funcoes,
  }
}

function getSegurancaSummary() {
  const years = getAvailableYearsSeguranca()
  const latestYear = years[0]
  const rows = latestYear ? loadSegurancaData(latestYear) : []
  const total = rows.find((row) => row.subfuncao === SEGURANCA_TOTAL) ?? rows[0]
  const subfuncoes = rows.filter((row) => row.subfuncao !== SEGURANCA_TOTAL)

  return {
    latestYear,
    years,
    total,
    subfuncoes,
  }
}

function FunctionRows({ area, rows }: { area: HealthArea; rows: HealthRow[] }) {
  return (
    <div className="mt-6" style={{ borderTop: "1px solid var(--border-01)" }}>
      {rows.map((row) => (
        <div
          key={`${area}-${row.funcao}`}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 py-3"
          style={{ borderBottom: "1px solid var(--border-01)" }}
        >
          <span style={{ ...S.body, color: "var(--text-01)" }}>
            {FUNCAO_LABELS[area][row.funcao] ?? row.funcao}
          </span>
          <span style={{ ...S.body, color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
            {formatMillions(row.liquidada)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SegurancaRows({ rows }: { rows: ReturnType<typeof getSegurancaSummary>["subfuncoes"] }) {
  return (
    <div className="mt-6" style={{ borderTop: "1px solid var(--border-01)" }}>
      {rows.map((row) => (
        <div
          key={`seguranca-${row.subfuncao}`}
          className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 py-3"
          style={{ borderBottom: "1px solid var(--border-01)" }}
        >
          <span style={{ ...S.body, color: "var(--text-01)" }}>
            {SUBFUNCAO_LABELS[row.subfuncao] ?? row.subfuncao}
          </span>
          <span style={{ ...S.body, color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
            {formatMillions(row.liquidada)}
          </span>
        </div>
      ))}
    </div>
  )
}

function getTransporteSummary() {
  const years = getAvailableYearsTransporte()
  const latestYear = years[0] ?? null
  const orc = latestYear ? loadTransporteOrcamento(latestYear) : null
  const dca = latestYear ? loadTransporteDca(latestYear) : null
  const taxa = orc && orc.dotacao_atualizada > 0
    ? (orc.empenhado / orc.dotacao_atualizada) * 100
    : null
  return { years, latestYear, orc, dca, taxa }
}

export default function IndexPage() {
  const summaries = HEALTH_AREAS.map((item) => ({ ...item, resumo: getAreaSummary(item.area) }))
  const seguranca = getSegurancaSummary()
  const transporte = getTransporteSummary()
  const poderPublico = getPoderPublicoSorocaba()
  const totalAgentes = poderPublico.grupos.reduce((total, grupo) => total + grupo.pessoas.length, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12 md:py-16" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p style={S.label}>Sorocaba, SP</p>
              <h1 className="font-semibold mt-3 mb-5" style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: "1.12", color: "var(--text-01)", maxWidth: "860px" }}>
                Para onde vai o dinheiro público
              </h1>
              <p style={{ ...S.body, maxWidth: "760px", fontSize: "16px", lineHeight: "26px" }}>
                Quanto Sorocaba gastou em saúde, educação e segurança pública, de onde veio esse dinheiro e em que áreas ele foi aplicado,
                com base em relatórios oficiais publicados pelo poder público, sem alteração manual dos valores orçamentários exibidos.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <p style={{ ...S.label, marginBottom: "20px" }}>Como usar este site</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={{ borderTop: "1px solid var(--border-01)" }}>
              {[
                { num: "01", titulo: "Escolha uma área", texto: "Saúde, Educação ou Segurança Pública. Cada uma tem os dados organizados por ano e período ou exercício." },
                { num: "02", titulo: "Veja os números", texto: "Quanto foi autorizado, comprometido, liquidado e efetivamente pago. A divisão por área aparece em cada painel." },
                { num: "03", titulo: "Confira a fonte", texto: "Nos datasets principais, cada linha publicada informa o PDF ou a URL oficial de origem. Quando houver lacuna, o site declara isso." },
              ].map((step, i) => (
                <div key={step.num} className="py-7" style={{
                  paddingRight: i < 2 ? "40px" : 0,
                  paddingLeft: i > 0 ? "40px" : 0,
                  borderLeft: i > 0 ? "1px solid var(--border-01)" : "none",
                }}>
                  <p className="font-mono mb-3" style={{ fontSize: "12px", color: "var(--text-04)" }}>{step.num}</p>
                  <p className="font-semibold mb-2" style={{ fontSize: "15px", color: "var(--text-01)" }}>{step.titulo}</p>
                  <p style={{ ...S.body, fontSize: "14px" }}>{step.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
              <div>
                <p style={S.label}>O que estes dados explicam</p>
                <h2 className="font-semibold mt-3 mb-5" style={{ fontSize: "30px", lineHeight: "38px", color: "var(--text-01)", maxWidth: "560px" }}>
                  O caminho documentado do dinheiro até onde a fonte permite enxergar
                </h2>
                <p style={{ ...S.body, maxWidth: "620px", fontSize: "15px", lineHeight: "24px" }}>
                  Com os dados atuais, qualquer pessoa consegue acompanhar a origem agregada do dinheiro,
                  a obrigação legal de aplicação, a execução orçamentária e o destino por função ou subfunção pública.
                  Quando a fonte não chega a fornecedor, unidade ou pessoa, o site declara essa lacuna.
                </p>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderTop: "1px solid var(--border-01)" }}>
                  {EXPLICACOES.map((item) => (
                    <div key={item.titulo} className="py-5 sm:pr-6" style={{ borderBottom: "1px solid var(--border-01)" }}>
                      <p className="font-semibold mb-2" style={{ color: "var(--text-01)", fontSize: "15px" }}>
                        {item.titulo}
                      </p>
                      <p style={S.body}>{item.texto}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                  <p style={S.label}>O que ainda não dá para afirmar</p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {LIMITES.map((limite) => (
                      <li key={limite} style={{ ...S.body, color: "var(--text-03)" }}>
                        {limite}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {summaries.map(({ area, titulo, href, resumo }) => {
                const periodLabel = area === "educacao"
                  ? `${resumo.period ?? "-"}º trimestre`
                  : `${resumo.period ?? "-"}º quadrimestre`
                const minLabel = area === "educacao" ? "Mín. constitucional: 25%" : "Mín. constitucional: 15%"
                return (
                  <Link
                    key={area}
                    href={href}
                    className="tile-link"
                    style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <p style={S.label}>{titulo}</p>
                          <h2 className="font-semibold mt-2" style={{ fontSize: "30px", color: "var(--text-01)" }}>
                            {resumo.total ? formatMillions(resumo.total.liquidada) : "sem dado"}
                          </h2>
                          <p className="mt-2" style={S.body}>
                            Gasto liquidado · {periodLabel} de {resumo.latestYear ?? "-"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-left sm:text-right">
                          <div>
                            <p style={S.label}>Receitas da área</p>
                            <p className="mt-2" style={{ ...S.body, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                              {resumo.latestRevenue ? formatMillions(resumo.latestRevenue.total_base_arrecadado) : "sem dado"}
                            </p>
                          </div>
                          <div>
                            <p style={S.label}>% aplicado</p>
                            <p className="mt-2" style={{ ...S.body, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                              {formatPercent(resumo.latestRevenue?.percentual_aplicado_liquidado)}
                            </p>
                            <p style={{ fontSize: "11px", color: "var(--text-04)", marginTop: "2px" }}>{minLabel}</p>
                          </div>
                        </div>
                      </div>

                      <FunctionRows area={area} rows={resumo.funcoes} />

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <p style={{ ...S.body, color: "var(--text-03)" }}>
                          Série disponível: {resumo.years.join(", ") || "nenhum"}
                        </p>
                        <span style={{ color: "var(--blue-50)", fontSize: "14px", whiteSpace: "nowrap" }}>
                          Ver painel
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}

              <Link
                href="/seguranca"
                className="tile-link"
                style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p style={S.label}>Segurança Pública</p>
                      <h2 className="font-semibold mt-2" style={{ fontSize: "30px", color: "var(--text-01)" }}>
                        {seguranca.total ? formatMillions(seguranca.total.liquidada) : "sem dado"}
                      </h2>
                      <p className="mt-2" style={S.body}>
                        Gasto liquidado anual · {seguranca.latestYear ?? "-"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left sm:text-right">
                      <div>
                        <p style={S.label}>Fonte</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)" }}>
                          SICONFI / DCA
                        </p>
                      </div>
                      <div>
                        <p style={S.label}>Série</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                          {seguranca.years.length > 1
                            ? `${Math.min(...seguranca.years)}–${Math.max(...seguranca.years)}`
                            : seguranca.years[0]?.toString() ?? "sem dado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <SegurancaRows rows={seguranca.subfuncoes} />

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p style={{ ...S.body, color: "var(--text-03)" }}>
                      Subfunções: guarda municipal, policiamento, defesa civil e inteligência.
                    </p>
                    <span style={{ color: "var(--blue-50)", fontSize: "14px", whiteSpace: "nowrap" }}>
                      Ver painel
                    </span>
                  </div>
                </div>
              </Link>

              <Link
                href="/transporte"
                className="tile-link"
                style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p style={S.label}>Transporte</p>
                      <h2 className="font-semibold mt-2" style={{ fontSize: "30px", color: "var(--text-01)" }}>
                        {transporte.dca ? formatMillions(transporte.dca.liquidado) : "sem dado"}
                      </h2>
                      <p className="mt-2" style={S.body}>
                        Gasto liquidado anual · função 26 · {transporte.latestYear ?? "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left sm:text-right">
                      <div>
                        <p style={S.label}>Fonte</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)" }}>
                          SICONFI / RREO
                        </p>
                      </div>
                      <div>
                        <p style={S.label}>Série</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                          {transporte.years.length > 1
                            ? `${Math.min(...transporte.years)}–${Math.max(...transporte.years)}`
                            : transporte.years[0]?.toString() ?? "sem dado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p style={{ ...S.body, color: "var(--text-03)" }}>
                      Inclui transporte público e obras viárias — subfunção única, sem discriminação.
                    </p>
                    <span style={{ color: "var(--blue-50)", fontSize: "14px", whiteSpace: "nowrap" }}>
                      Ver painel
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-elevated)", borderTop: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <p style={S.label}>Mapa de responsabilidade</p>
                <h2 className="font-semibold mt-2" style={{ fontSize: "28px", color: "var(--text-01)" }}>
                  Poder público ligado a Sorocaba
                </h2>
              </div>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                {totalAgentes} agentes mapeados · atualizado em {poderPublico.atualizado_em}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {poderPublico.grupos.map((grupo) => (
                <section key={grupo.id} style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-base)" }}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p style={S.label}>{grupo.escopo}</p>
                        <h3 className="font-semibold mt-2" style={{ fontSize: "20px", color: "var(--text-01)" }}>
                          {grupo.titulo}
                        </h3>
                      </div>
                      <span style={{ ...S.body, color: "var(--text-03)" }}>
                        {grupo.pessoas.length}
                      </span>
                    </div>

                    {grupo.observacao ? (
                      <p className="mt-4" style={{ ...S.body, color: "var(--text-03)" }}>
                        {grupo.observacao}
                      </p>
                    ) : null}

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      {grupo.pessoas.map((pessoa) => (
                        <div
                          key={`${grupo.id}-${pessoa.nome}`}
                          className="py-3"
                          style={{ borderTop: "1px solid var(--border-01)" }}
                        >
                          <p style={{ ...S.body, color: "var(--text-01)", fontWeight: 600 }}>
                            {pessoa.nome_publico ?? pessoa.nome}
                          </p>
                          <p className="mt-1" style={{ ...S.body, color: "var(--text-03)" }}>
                            {pessoa.cargo}
                            {pessoa.partido ? ` · ${pessoa.partido}` : ""}
                            {pessoa.mandato ? ` · ${pessoa.mandato}` : ""}
                          </p>
                          {pessoa.remuneracao ? (
                            <p className="mt-2" style={{ ...S.body, color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                              {formatBRL(pessoa.remuneracao.valor_bruto_mensal)} / mês
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <p className="mt-6" style={{ ...S.body, color: "var(--text-03)" }}>
              {poderPublico.observacao}
            </p>
            <p className="mt-3" style={{ ...S.body, color: "var(--text-04)", fontSize: "13px" }}>
              Remuneração exibida como subsídio bruto mensal oficial do cargo, quando publicada em fonte oficial.
            </p>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10 flex flex-wrap gap-4" style={S.container}>
            <Link href="/dados" className="nav-link">Ver datasets publicados</Link>
            <Link href="/seguranca" className="nav-link">Ver segurança pública</Link>
            <Link href="/auditoria" className="nav-link">Ver auditoria de agentes</Link>
            <Link href="/auditoria/ranking" className="nav-link">Ver ranking</Link>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
