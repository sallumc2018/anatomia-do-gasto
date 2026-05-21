import React from "react"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import TheoGuide from "@/components/theo/theo-guide"
import { AvisoMaturidade } from "@/components/ui/aviso-maturidade"
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
  { area: "saude", titulo: "Saúde", href: "/sorocaba/saude" },
  { area: "educacao", titulo: "Educação", href: "/sorocaba/educacao" },
]

const SEGURANCA_TOTAL = "06 - Segurança Pública"

const PERGUNTAS_GUIA = [
  {
    pergunta: "Para onde foi o dinheiro?",
    resposta: "Comece pelo orçamento por função e depois aprofunde por área.",
    href: "/sorocaba/executivo",
    status: "Disponível",
    termos: "orçamento, função, gasto total",
  },
  {
    pergunta: "Quanto entrou em Sorocaba?",
    resposta: "Veja impostos, transferências e composição das receitas.",
    href: "/sorocaba/receita",
    status: "Disponível",
    termos: "receita, ISS, IPTU, ICMS, FPM",
  },
  {
    pergunta: "O dinheiro foi só autorizado ou realmente pago?",
    resposta: "Compare dotação, empenhado, liquidado e pago.",
    href: "/sorocaba/execucao",
    status: "Disponível",
    termos: "execução, liquidado, pago",
  },
  {
    pergunta: "Quanto custa saúde, educação, segurança e transporte?",
    resposta: "Abra os painéis de serviços públicos e compare a série histórica.",
    href: "/sorocaba/saude",
    status: "Disponível",
    termos: "serviços públicos, gasto por área",
  },
  {
    pergunta: "Quanto custa a Câmara e cada vereador?",
    resposta: "Veja orçamento legislativo, subsídios e agentes públicos mapeados.",
    href: "/sorocaba/camara-municipal",
    status: "Disponível",
    termos: "vereadores, Câmara, subsídio",
  },
  {
    pergunta: "Sorocaba está endividada?",
    resposta: "Confira dívida, pessoal, RCL, previdência e limites fiscais.",
    href: "/sorocaba/saude-fiscal",
    status: "Disponível",
    termos: "dívida, pessoal, RCL, previdência",
  },
  {
    pergunta: "Quem recebeu dinheiro público?",
    resposta: "Conta-corrente de fornecedores 2020–2025: veja quem recebeu quanto da Prefeitura de Sorocaba.",
    href: "/sorocaba/fornecedores",
    status: "Disponível",
    termos: "fornecedores, contratos, pagamentos",
  },
  {
    pergunta: "Quais dados posso baixar e auditar?",
    resposta: "Acesse os CSVs publicados e a metodologia de validação.",
    href: "/sorocaba/dados",
    status: "Disponível",
    termos: "CSV, fonte, metodologia",
  },
]

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

const SOROCABA_STATUS = {
  percent: 45,
  label: "Status geral de Sorocaba",
  note: "Piloto publicado, com dados centrais no ar e cobertura ainda em expansão.",
}

function formatPercent(value?: number): string {
  if (value === undefined) return "sem dado"
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
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
  return { latestYear, period: rows[0]?.quadrimestre, years, total, latestRevenue, funcoes }
}

function getSegurancaSummary() {
  const years = getAvailableYearsSeguranca()
  const latestYear = years[0]
  const rows = latestYear ? loadSegurancaData(latestYear) : []
  const total = rows.find((row) => row.subfuncao === SEGURANCA_TOTAL) ?? rows[0]
  const subfuncoes = rows.filter((row) => row.subfuncao !== SEGURANCA_TOTAL)
  return { latestYear, years, total, subfuncoes }
}

function getTransporteSummary() {
  const years = getAvailableYearsTransporte()
  const latestYear = years[0] ?? null
  const orc = latestYear ? loadTransporteOrcamento(latestYear) : null
  const dca = latestYear ? loadTransporteDca(latestYear) : null
  return { years, latestYear, orc, dca }
}

function SorocabaStatusProgress() {
  return (
    <div className="mb-7" style={{ maxWidth: "520px" }}>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <p style={{ ...S.label, marginBottom: 0 }}>{SOROCABA_STATUS.label}</p>
        <p
          className="font-mono"
          style={{ fontSize: "14px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
        >
          {SOROCABA_STATUS.percent}%
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={SOROCABA_STATUS.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={SOROCABA_STATUS.percent}
        style={{ height: "8px", backgroundColor: "var(--border-01)", overflow: "hidden" }}
      >
        <div style={{ width: `${SOROCABA_STATUS.percent}%`, height: "100%", backgroundColor: "var(--blue-50)" }} />
      </div>
      <p className="mt-2" style={{ ...S.body, fontSize: "13px", color: "var(--text-03)" }}>
        {SOROCABA_STATUS.note}
      </p>
    </div>
  )
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

export default function IndexPage() {
  const summaries = HEALTH_AREAS.map((item) => ({ ...item, resumo: getAreaSummary(item.area) }))
  const seguranca = getSegurancaSummary()
  const transporte = getTransporteSummary()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Anatomia do Gasto",
            "url": "https://www.anatomiadogasto.ong.br",
            "description": "ONG brasileira que organiza dados públicos em linguagem cidadã, com fonte, método e rastreabilidade.",
            "email": "contato@anatomiadogasto.ong.br",
            "sameAs": ["https://github.com/sallumc2018/anatomia-do-gasto"],
          }),
        }}
      />
      <AvisoMaturidade />
      <main id="conteudo" className="flex-1">

        {/* ── Seção 1: Entrada — Théo + Cards ── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12 md:py-16" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10">

              {/* Esquerda: intro + Théo */}
              <div>
                <p style={S.label}>Sorocaba, SP</p>
                <h1
                  className="font-semibold mt-3"
                  style={{
                    fontSize: "clamp(26px, 3.5vw, 42px)",
                    lineHeight: "1.12",
                    color: "var(--text-01)",
                    marginBottom: "12px",
                  }}
                >
                  Para onde vai o dinheiro público
                </h1>
                <p
                  style={{
                    ...S.body,
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "var(--text-03)",
                    marginBottom: "24px",
                  }}
                >
                  Dados fiscais oficiais em linguagem compreensível. Fontes declaradas, limites explícitos.
                </p>
                <SorocabaStatusProgress />
                <TheoGuide />
              </div>

              {/* Direita: cards de perguntas */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2"
                style={{ borderTop: "1px solid var(--border-01)", borderLeft: "1px solid var(--border-01)" }}
              >
                {PERGUNTAS_GUIA.map((item) => (
                  <Link
                    key={item.pergunta}
                    href={item.href}
                    className="tile-link p-5 flex flex-col gap-3"
                    style={{
                      minHeight: "170px",
                      borderRight: "1px solid var(--border-01)",
                      borderBottom: "1px solid var(--border-01)",
                    }}
                  >
                    <p style={{ ...S.label, color: item.status === "Disponível" ? "var(--blue-40)" : "var(--support-warning)" }}>
                      {item.status}
                    </p>
                    <h3 className="font-semibold" style={{ fontSize: "16px", lineHeight: "23px", color: "var(--text-01)" }}>
                      {item.pergunta}
                    </h3>
                    <p style={{ ...S.body, flex: 1, fontSize: "13px" }}>{item.resposta}</p>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Seção 2: Dados disponíveis ── */}
        <section id="dados-disponiveis" style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p style={{ ...S.label, marginBottom: "20px" }}>Dados disponíveis · Sorocaba 2020–2025</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {summaries.map(({ area, titulo, href, resumo }) => {
                const periodLabel =
                  area === "educacao"
                    ? `${resumo.period ?? "-"}º trimestre`
                    : `${resumo.period ?? "-"}º quadrimestre`
                const minLabel =
                  area === "educacao" ? "Mín. constitucional: 25%" : "Mín. constitucional: 15%"
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
                        <div className="mobile-metric-grid grid grid-cols-2 gap-4 text-left sm:text-right">
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
                            <p style={{ fontSize: "11px", color: "var(--text-04)", marginTop: "2px" }}>
                              {minLabel}
                            </p>
                          </div>
                        </div>
                      </div>
                      <FunctionRows area={area} rows={resumo.funcoes} />
                      <div className="mobile-card-footer mt-6 flex items-center justify-between gap-4">
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
                href="/sorocaba/seguranca"
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
                    <div className="mobile-metric-grid grid grid-cols-2 gap-4 text-left sm:text-right">
                      <div>
                        <p style={S.label}>Fonte</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)" }}>SICONFI / DCA</p>
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
                  <div className="mobile-card-footer mt-6 flex items-center justify-between gap-4">
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
                href="/sorocaba/transporte"
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
                    <div className="mobile-metric-grid grid grid-cols-2 gap-4 text-left sm:text-right">
                      <div>
                        <p style={S.label}>Fonte</p>
                        <p className="mt-2" style={{ ...S.body, color: "var(--text-01)" }}>SICONFI / RREO</p>
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
                  <div className="mobile-card-footer mt-6 flex items-center justify-between gap-4">
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

        {/* ── Seção 3: Contexto ── */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              {/* O que explica */}
              <div>
                <p style={S.label}>O que estes dados explicam</p>
                <div className="mt-5" style={{ borderTop: "1px solid var(--border-01)" }}>
                  {EXPLICACOES.map((item) => (
                    <div key={item.titulo} className="py-4" style={{ borderBottom: "1px solid var(--border-01)" }}>
                      <p className="font-semibold mb-1" style={{ color: "var(--text-01)", fontSize: "14px" }}>
                        {item.titulo}
                      </p>
                      <p style={S.body}>{item.texto}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limites */}
              <div>
                <p style={S.label}>O que ainda não dá para afirmar</p>
                <ul className="mt-5" style={{ borderTop: "1px solid var(--border-01)" }}>
                  {LIMITES.map((limite) => (
                    <li key={limite} className="py-4" style={{ ...S.body, color: "var(--text-03)", borderBottom: "1px solid var(--border-01)", listStyle: "none" }}>
                      {limite}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Links */}
              <div>
                <p style={S.label}>Sobre o projeto</p>
                <p className="mt-5" style={{ ...S.body, color: "var(--text-03)", marginBottom: "20px" }}>
                  Rastreador auditável independente, sem vínculo com partidos ou governos. Piloto em Sorocaba/SP.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { href: "/metodologia", label: "Metodologia e fontes" },
                    { href: "/sobre", label: "Sobre o projeto" },
                    { href: "/dados", label: "Baixar datasets" },
                    { href: "/auditoria", label: "Agentes públicos mapeados" },
                    { href: "/contato", label: "Contato" },
                  ].map((link) => (
                    <Link key={link.href} href={link.href} className="nav-link" style={{ fontSize: "14px" }}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
