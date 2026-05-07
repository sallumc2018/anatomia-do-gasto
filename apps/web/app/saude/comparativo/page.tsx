import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { getAvailableYears, loadYearData, TOTAL_ROW, type HealthArea } from "@/lib/data"

const AREA: HealthArea = "saude"
const QUAD_ANUAL = 3 // 3º quadrimestre = acumulado Jan–Dez

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  h2: {
    fontSize: "24px",
    lineHeight: "32px",
    color: "var(--text-01)",
    fontWeight: 300,
  } as React.CSSProperties,
  h3: {
    fontSize: "15px",
    lineHeight: "22px",
    color: "var(--text-01)",
    fontWeight: 600,
  } as React.CSSProperties,
  body: {
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  small: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "var(--text-04)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmtMi(v: number): string {
  const m = v / 1_000_000
  return `R$ ${m.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
}

function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`
}

function delta(curr: number, prev: number): number {
  if (!prev) return 0
  return ((curr - prev) / prev) * 100
}

const FUNCOES = [
  { key: "administracao geral",                          label: "Administração geral" },
  { key: "atencao basica",                               label: "Atenção básica" },
  { key: "assistencia hospitalar e ambulatorial",        label: "Hospitalar e ambulatorial" },
  { key: "suporte profilatico e terapeutico",            label: "Suporte profilático" },
  { key: "vigilancia sanitaria",                         label: "Vigilância sanitária" },
  { key: "vigilancia epidemiologica",                    label: "Vigilância epidemiológica" },
] as const

const EXPLICACOES_FUNCOES = [
  {
    key: "administracao geral",
    label: "Administração geral",
    texto: "Salários e custos operacionais da Secretaria de Saúde: gestão, TI, recursos humanos e serviços de suporte que não são atendimento direto ao paciente.",
  },
  {
    key: "atencao basica",
    label: "Atenção básica",
    texto: "Unidades Básicas de Saúde (UBSs), agentes comunitários de saúde, médicos de família, vacinação, saúde bucal e programas de prevenção. É o primeiro contato da população com o sistema público de saúde.",
  },
  {
    key: "assistencia hospitalar e ambulatorial",
    label: "Hospitalar e ambulatorial",
    texto: "Hospitais, UPAs (Unidades de Pronto Atendimento), internações, cirurgias e consultas com especialistas. Cobre os casos que não podem ser resolvidos na UBS.",
  },
  {
    key: "suporte profilatico e terapeutico",
    label: "Suporte profilático e terapêutico",
    texto: "Medicamentos especializados, órteses, próteses e insumos para pacientes com doenças crônicas que precisam de tratamento contínuo.",
  },
  {
    key: "vigilancia sanitaria",
    label: "Vigilância sanitária",
    texto: "Fiscalização de restaurantes, clínicas, farmácias, hospitais privados e outros estabelecimentos que podem afetar a saúde da população.",
  },
  {
    key: "vigilancia epidemiologica",
    label: "Vigilância epidemiológica",
    texto: "Monitoramento de doenças, investigação de surtos, notificação obrigatória de casos e ações para controlar epidemias e endemias.",
  },
]

export default function ComparativoSaudePage() {
  const years = getAvailableYears(AREA).reverse() // crescente: 2020, 2021…
  const totalRow = TOTAL_ROW[AREA]

  type YearRow = {
    year: number
    pago: number
    dotacao: number
    execPct: number
    funcoes: Record<string, number>
    note: string | null
  }

  const rows: YearRow[] = years.map((year) => {
    const data = loadYearData(year, AREA)
    const q = data.filter((r) => r.quadrimestre === QUAD_ANUAL)
    const total = q.find((r) => r.funcao === totalRow)
    const pago     = total?.paga     ?? 0
    const dotacao  = total?.dotacao  ?? 0
    const execPct  = dotacao > 0 ? (pago / dotacao) * 100 : 0

    const funcMap: Record<string, number> = {}
    for (const f of FUNCOES) {
      funcMap[f.key] = q.find((r) => r.funcao === f.key)?.paga ?? 0
    }

    // 2021: dotação inflada por emendas COVID — execução não é comparável
    const note = year === 2021 && dotacao > 1_000_000_000
      ? "Dotação inclui emendas emergenciais COVID aprovadas ao longo do ano e não totalmente utilizadas. A taxa de execução não é comparável com outros anos."
      : null

    return { year, pago, dotacao, execPct, funcoes: funcMap, note }
  })

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/saude" style={{ ...S.small, color: "var(--text-03)", textDecoration: "none" }}>Saúde</Link>
              <span style={S.small}>/</span>
              <span style={S.small}>Série histórica</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                Saúde · Sorocaba/SP · {years[0]}–{years[years.length - 1]}
              </p>
              <h1 className="font-light mb-5" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                Quanto Sorocaba gastou em saúde a cada ano
              </h1>
              <p style={{ ...S.body, fontSize: "15px", lineHeight: "24px", maxWidth: "640px" }}>
                Esta página reúne em um único lugar o gasto anual em saúde de {years[0]} a {years[years.length - 1]},
                com os valores de cada área, a taxa de execução do orçamento e a variação em relação ao ano anterior.
                Todos os números vêm diretamente dos relatórios oficiais publicados pela Prefeitura de Sorocaba.
              </p>
            </div>
          </div>
        </section>

        {/* Como ler os números */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Como ler os números</p>
            <h2 className="font-light mb-10" style={S.h2}>O que cada etapa do orçamento significa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={S.borderTop}>
              {[
                {
                  num: "01",
                  termo: "Dotação atualizada",
                  def: "Quanto a Câmara Municipal autorizou a prefeitura a gastar em saúde naquele ano, incluindo ajustes e suplementações aprovados ao longo do exercício.",
                },
                {
                  num: "02",
                  termo: "Empenhada",
                  def: "Valor para o qual a prefeitura firmou contratos ou compromissos formais de pagamento com fornecedores e prestadores de serviço.",
                },
                {
                  num: "03",
                  termo: "Liquidada",
                  def: "Valor dos serviços ou materiais que foram efetivamente entregues, conferidos e aprovados pela prefeitura — o serviço está comprovado, mas o pagamento pode ainda não ter sido feito.",
                },
                {
                  num: "04",
                  termo: "Paga",
                  def: "Valor que a prefeitura transferiu de fato para os fornecedores ou prestadores. É o dinheiro que saiu do caixa. Esta é a coluna usada na série histórica abaixo.",
                },
              ].map((item, i) => (
                <div key={item.num} className="py-8" style={{
                  paddingRight: i < 3 ? "32px" : 0,
                  paddingLeft:  i > 0 ? "32px" : 0,
                  borderLeft:   i > 0 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-mono mb-3" style={{ color: "var(--text-04)", fontSize: "12px" }}>{item.num}</p>
                  <p className="font-semibold mb-3" style={{ ...S.h3 }}>{item.termo}</p>
                  <p style={S.body}>{item.def}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                <strong style={{ color: "var(--text-01)" }}>Taxa de execução</strong> = valor pago ÷ dotação atualizada.
                Acima de 85% significa que o dinheiro autorizado foi quase todo usado.
                Abaixo de 70% pode indicar orçamento suplementado mas não executado, ou atrasos no calendário de pagamentos.
              </p>
            </div>
          </div>
        </section>

        {/* Série histórica — tabela */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Série histórica · {years[0]}–{years[years.length - 1]}</p>
            <h2 className="font-light mb-3" style={S.h2}>Total pago em saúde por ano</h2>
            <p className="mb-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Valores do 3º quadrimestre (acumulado Jan–Dez) de cada ano.
              O 3º quadrimestre é o relatório mais completo do exercício, publicado após o encerramento do ano fiscal.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
                    {["Ano", "Total pago", "Variação", "Execução", "Relatório"].map((h) => (
                      <th key={h} style={{
                        textAlign: h === "Ano" ? "left" : "right",
                        padding: "10px 16px 10px 0",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.06em",
                        color: "var(--text-03)",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const prev = rows[i - 1]
                    const d = prev ? delta(row.pago, prev.pago) : null
                    const hasNote = !!row.note
                    return (
                      <tr key={row.year} style={{ borderBottom: "1px solid var(--border-01)" }}>
                        <td style={{ padding: "14px 16px 14px 0", color: "var(--text-01)", fontWeight: 600, fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap" }}>
                          {row.year}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-01)", whiteSpace: "nowrap" }}>
                          {fmtMi(row.pago)}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: d === null ? "var(--text-04)" : d < 0 ? "#fa4d56" : d > 15 ? "#42be65" : "var(--text-02)" }}>
                          {d === null ? "—" : `${d >= 0 ? "+" : ""}${fmtPct(d)}`}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: hasNote ? "var(--text-04)" : row.execPct >= 85 ? "var(--text-02)" : "#fa4d56" }}>
                          {hasNote ? "—*" : fmtPct(row.execPct)}
                        </td>
                        <td style={{ padding: "14px 0 14px 0", textAlign: "right" }}>
                          <Link href={`/saude/relatorio/${row.year}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none" }}>
                            Ver {row.year} →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {rows.some((r) => r.note) && (
              <div className="mt-6 p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                {rows.filter((r) => r.note).map((r) => (
                  <p key={r.year} style={{ ...S.small, color: "var(--text-03)" }}>
                    <strong>* {r.year}:</strong> {r.note}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Distribuição por função — uma seção por ano */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Onde foi cada real</p>
            <h2 className="font-light mb-3" style={S.h2}>Distribuição por área de saúde · 3º quadrimestre</h2>
            <p className="mb-10" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Cada linha abaixo mostra o valor pago em cada área e a participação percentual no total daquele ano.
              Quando uma área mostra zero, o relatório daquele ano não detalhou aquela função separadamente.
            </p>

            <div className="flex flex-col gap-0" style={S.borderTop}>
              {rows.map((row) => (
                <div key={row.year} className="py-10" style={S.borderBottom}>
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="font-mono font-semibold" style={{ fontSize: "28px", color: "var(--text-01)" }}>{row.year}</span>
                    <span style={{ ...S.body, color: "var(--text-03)" }}>Total pago: {fmtMi(row.pago)}</span>
                    <Link href={`/saude/relatorio/${row.year}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none", marginLeft: "auto" }}>
                      Relatório completo →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={S.borderTop}>
                    {FUNCOES.map((f) => {
                      const v = row.funcoes[f.key] ?? 0
                      const pct = row.pago > 0 ? (v / row.pago) * 100 : 0
                      return (
                        <div key={f.key} className="py-5 pr-6" style={S.borderBottom}>
                          <p style={{ ...S.small, color: "var(--text-03)", marginBottom: "4px" }}>{f.label}</p>
                          <p className="font-mono" style={{ fontSize: "16px", color: v > 0 ? "var(--text-01)" : "var(--text-04)" }}>
                            {v > 0 ? fmtMi(v) : "não detalhado"}
                          </p>
                          {v > 0 && (
                            <p style={{ ...S.small, marginTop: "2px" }}>{fmtPct(pct)} do total</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {row.note && (
                    <p className="mt-4" style={{ ...S.small, color: "var(--text-04)" }}>* {row.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* O que cada área cobre */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>O que cada área cobre</p>
            <h2 className="font-light mb-10" style={S.h2}>Explicação de cada função de saúde</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={S.borderTop}>
              {EXPLICACOES_FUNCOES.map((item, i) => (
                <div key={item.key} className="py-8" style={{
                  paddingRight: i % 2 === 0 ? "48px" : 0,
                  paddingLeft:  i % 2 === 1 ? "48px" : 0,
                  borderLeft:   i % 2 === 1 ? "1px solid var(--border-01)" : "none",
                  ...S.borderBottom,
                }}>
                  <p className="font-semibold mb-3" style={S.h3}>{item.label}</p>
                  <p style={S.body}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* O que estes dados NÃO mostram */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Origem, volume e destino por função</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Quanto a prefeitura recebeu de impostos próprios, do Estado e da União para aplicar em saúde.",
                    "Quanto foi autorizado a gastar (dotação), quanto foi comprometido (empenho), quanto foi entregue (liquidação) e quanto foi pago.",
                    "Como o gasto se divide entre as grandes áreas: atenção básica, hospitalar, vigilância e administração.",
                    "A variação do gasto de um ano para outro.",
                    "O arquivo PDF oficial do qual cada dado foi extraído.",
                  ].map((t) => (
                    <li key={t} style={S.body}>✓ {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="uppercase font-semibold mb-2" style={S.label}>O que estes dados não mostram</p>
                <h2 className="font-light mb-6" style={S.h2}>Lacunas declaradas da fonte oficial</h2>
                <ul className="flex flex-col gap-3">
                  {[
                    "Fornecedor, CNPJ ou empresa que recebeu cada pagamento.",
                    "Número de contratos, notas de empenho individuais ou processos licitatórios.",
                    "Qual UBS, hospital ou unidade de saúde executou o gasto.",
                    "Quantos pacientes foram atendidos ou quantos procedimentos foram realizados.",
                    "O responsável administrativo por cada ato de despesa.",
                  ].map((t) => (
                    <li key={t} style={{ ...S.body, color: "var(--text-03)" }}>— {t}</li>
                  ))}
                </ul>
                <p className="mt-6" style={{ ...S.small, color: "var(--text-04)" }}>
                  Essas informações existem em outros sistemas do portal de transparência, mas não estão
                  nos relatórios quadrimestrais de saúde que este site processa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  Relatórios de Aplicação da Lei de Responsabilidade Fiscal (LRF) em Saúde, publicados
                  pela Prefeitura de Sorocaba a cada quadrimestre no portal da transparência.
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Um script Python lê os PDFs, extrai as tabelas de despesas e salva em arquivos CSV.
                  Cada linha do CSV indica de qual PDF ela veio. O código e os arquivos são públicos.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a href="https://fazenda.sorocaba.sp.gov.br/transparencia/" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Portal da transparência de Sorocaba →
                  </a>
                  <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Como extraímos os dados →
                  </Link>
                  <Link href="/dados" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Baixar os CSVs →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nav para relatórios individuais */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-6" style={S.label}>Relatórios detalhados por ano</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...years].reverse().map((year) => (
                <Link key={year} href={`/saude/relatorio/${year}`}
                  className="tile-link"
                  style={{ border: "1px solid var(--border-01)", padding: "16px", textAlign: "center", textDecoration: "none" }}>
                  <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{year}</p>
                  <p style={{ ...S.small, marginTop: "4px" }}>Ver relatório</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
