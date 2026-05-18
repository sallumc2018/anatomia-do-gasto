import type { Metadata } from "next"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { DadoQueMostra } from "@/components/ui/dado-que-mostra"
import { DonutFuncoes, type DonutPoint } from "@/components/charts/DonutFuncoes"
import { PctRclChart, type PctRclPoint } from "@/components/charts/PctRclChart"
import {
  getAvailableYearsFiscal,
  loadPessoal,
  loadDividaDetalhada,
  loadRclDetalhada,
  loadRpps,
  type PessoalRow,
  type DividaDetalhadaRow,
  type RclDetalhadaRow,
  type RppsRow,
} from "@/lib/data"

export const metadata: Metadata = {
  title: "Saúde Fiscal de Sorocaba",
  description:
    "Despesa com pessoal, dívida consolidada e Receita Corrente Líquida de Sorocaba 2020–2025. Comparação com os limites da Lei de Responsabilidade Fiscal. Fonte: SICONFI/Tesouro Nacional.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/saude-fiscal" },
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

function StatusBadge({ pct, limite, label }: { pct: number; limite: number; label: string }) {
  const pct90 = limite * 0.90
  const pct95 = limite * 0.95
  const isAlert = pct >= pct90
  const isPrud  = pct >= pct95
  const isOver  = pct >= limite
  const color = isOver ? "#da1e28" : isPrud ? "#f1c21b" : isAlert ? "#f1c21b" : "#24a148"
  const text  = isOver ? "Acima do limite" : isPrud ? "Limite prudencial" : isAlert ? "Alerta" : "Dentro do limite"
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color, border: `1px solid ${color}`, padding: "2px 8px" }}>
      {label}: {text}
    </span>
  )
}

export default function SaudeFiscalPage() {
  const anos = getAvailableYearsFiscal()
  const anoAtual = anos[0] ?? 2025

  const pessoalSerie: PessoalRow[]          = anos.map((a) => loadPessoal(a)).filter((r): r is PessoalRow => r !== null).sort((a, b) => a.ano - b.ano)
  const dividaSerie:  DividaDetalhadaRow[]  = anos.map((a) => loadDividaDetalhada(a)).filter((r): r is DividaDetalhadaRow => r !== null).sort((a, b) => a.ano - b.ano)
  const rclSerie:     RclDetalhadaRow[]     = anos.map((a) => loadRclDetalhada(a)).filter((r): r is RclDetalhadaRow => r !== null).sort((a, b) => a.ano - b.ano)
  const rppsSerie:    RppsRow[]             = anos.map((a) => loadRpps(a)).filter((r): r is RppsRow => r !== null).sort((a, b) => a.ano - b.ano)

  const pessoalAtual = pessoalSerie.find((r) => r.ano === anoAtual)
  const dividaAtual  = dividaSerie.find((r)  => r.ano === anoAtual)
  const rclAtual     = rclSerie.find((r)     => r.ano === anoAtual)
  const rppsAtual    = rppsSerie.find((r)    => r.ano === anoAtual)
  const transferenciasIdentificadas = rclAtual
    ? rclAtual.fpm + rclAtual.icms + rclAtual.ipva + rclAtual.fundeb + rclAtual.outras_transferencias
    : 0
  const outrasTransferenciasMenores = rclAtual
    ? Math.max(0, rclAtual.transferencias_total - transferenciasIdentificadas)
    : 0

  const pessoalChartData: PctRclPoint[] = pessoalSerie.map((r) => ({ ano: String(r.ano), valor: r.dtp_pct_rcl }))
  const dividaChartData:  PctRclPoint[] = dividaSerie.map((r)  => ({ ano: String(r.ano), valor: r.dc_pct_rcl }))

  // Donut — composição das Receitas Correntes (bruto, antes das deduções LRF)
  const donutData: DonutPoint[] = rclAtual ? [
    { nome: "ISS",            valor: rclAtual.iss,                   color: "#0f62fe" },
    { nome: "ICMS",           valor: rclAtual.icms,                  color: "#4589ff" },
    { nome: "IPTU",           valor: rclAtual.iptu,                  color: "#78a9ff" },
    { nome: "FUNDEB",         valor: rclAtual.fundeb,                color: "#a6c8ff" },
    { nome: "IPVA",           valor: rclAtual.ipva,                  color: "#6929c4" },
    { nome: "Serviços",       valor: rclAtual.receita_servicos,      color: "#42be65" },
    { nome: "Patrimonial",    valor: rclAtual.receita_patrimonial,   color: "#24a148" },
    { nome: "Contrib./COSIP", valor: rclAtual.receita_contribuicoes, color: "#f1c21b" },
    { nome: "Outros",         valor: rclAtual.irrf + rclAtual.itbi + rclAtual.fpm
                                   + rclAtual.outras_tributarias + rclAtual.outras_transferencias
                                   + rclAtual.outras_correntes + rclAtual.outros,  color: "#525252" },
  ].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor) : []

  // Insights pessoal
  const pessoal2020 = pessoalSerie.find((r) => r.ano === 2020)
  const pessoalInsights: string[] = [
    ...(pessoalAtual ? [
      `Em ${anoAtual}, Sorocaba gastou ${pessoalAtual.dtp_pct_rcl.toFixed(2)}% da RCL ajustada com pessoal — o limite legal para o Executivo é 54% (LRF art. 20). A margem disponível é de ${(pessoalAtual.limite_maximo_pct - pessoalAtual.dtp_pct_rcl).toFixed(2)} pontos percentuais.`,
      `Do total, ${fmt(pessoalAtual.pessoal_ativo)} foram com pessoal ativo e ${fmt(pessoalAtual.pessoal_inativo)} com inativos e pensionistas (RPPS).`,
    ] : []),
    ...(pessoal2020 && pessoalAtual ? [
      `O pico foi em 2020, com ${pessoal2020.dtp_pct_rcl.toFixed(2)}% da RCL ajustada, período de pandemia com menor arrecadação e manutenção da folha. Em ${anoAtual} o índice caiu para ${pessoalAtual.dtp_pct_rcl.toFixed(2)}%.`,
    ] : []),
  ]

  // Insights dívida
  const dividaInsights: string[] = [
    ...(dividaAtual ? [
      `A dívida consolidada bruta de Sorocaba em ${anoAtual} era de ${fmt(dividaAtual.dc_bruta)} (${dividaAtual.dc_pct_rcl.toFixed(1)}% da base ajustada informada no RGF). O limite fixado pela Resolução do Senado Federal 40/2001 é de 120% — a cidade usa apenas ${dividaAtual.dc_pct_rcl.toFixed(1)}% desse espaço.`,
      `A dívida consolidada líquida (DCL) foi de ${fmt(dividaAtual.dcl)} (${dividaAtual.dcl_pct_rcl.toFixed(2)}% da base ajustada informada no RGF). Sorocaba possui ampla capacidade de endividamento não utilizada.`,
      `O passivo atuarial do RPPS somou ${fmt(dividaAtual.passivo_atuarial)} — compromisso previdenciário futuro com servidores, não contabilizado no limite do Senado, mas relevante para a sustentabilidade fiscal de longo prazo.`,
    ] : []),
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
                <p className="uppercase font-semibold" style={S.label}>Saúde Fiscal · Sorocaba/SP</p>
                <span style={{ fontSize: "10px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", color: "var(--text-04)", border: "1px solid var(--border-02)", padding: "3px 8px" }}>
                  Série 2020–{anoAtual}
                </span>
              </div>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Limites fiscais e sustentabilidade das finanças municipais
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "12px" }}>
                A Lei de Responsabilidade Fiscal (LRF) estabelece limites para despesa com pessoal
                e endividamento dos municípios. Em {anoAtual}, Sorocaba gastou{" "}
                <strong style={{ color: "var(--text-01)" }}>{pessoalAtual?.dtp_pct_rcl.toFixed(2)}%</strong> da
                RCL ajustada com pessoal (limite: 54%) e manteve dívida de{" "}
                <strong style={{ color: "var(--text-01)" }}>{dividaAtual?.dc_pct_rcl.toFixed(1)}%</strong> da
                base ajustada do RGF (limite: 120%).
              </p>
              <p style={{ ...S.body, maxWidth: "640px", color: "var(--text-03)", marginBottom: "20px" }}>
                Dados extraídos do RGF (Relatório de Gestão Fiscal) e do RREO (Relatório Resumido
                da Execução Orçamentária) publicados no SICONFI pelo Tesouro Nacional.
              </p>
              <div className="flex flex-wrap gap-3">
                {pessoalAtual && <StatusBadge pct={pessoalAtual.dtp_pct_rcl} limite={pessoalAtual.limite_maximo_pct} label="Pessoal" />}
                {dividaAtual  && <StatusBadge pct={dividaAtual.dc_pct_rcl}   limite={120}  label="Dívida" />}
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: `RCL ${anoAtual}`,              valor: pessoalAtual ? fmt(pessoalAtual.rcl) : "—",   nota: "Receita Corrente Líquida oficial" },
                { label: "RCL ajustada",                  valor: pessoalAtual ? fmt(pessoalAtual.rcl_ajustada) : "—", nota: "Base usada no limite de pessoal" },
                { label: "Despesa com pessoal",           valor: pessoalAtual ? `${pessoalAtual.dtp_pct_rcl.toFixed(2)}%` : "—",  nota: `da RCL ajustada — limite: ${pessoalAtual?.limite_maximo_pct ?? 54}%` },
                { label: "Dívida consolidada bruta",      valor: dividaAtual  ? `${dividaAtual.dc_pct_rcl.toFixed(1)}%` : "—",    nota: "da base ajustada do RGF — limite Senado: 120%" },
              ].map((item) => (
                <div key={item.label}>
                  <p style={S.label} className="mb-1">{item.label}</p>
                  <p className="font-light mt-2" style={{ fontSize: "28px", color: "var(--text-01)", fontVariantNumeric: "tabular-nums", lineHeight: "1.2" }}>
                    {item.valor}
                  </p>
                  <p className="mt-1" style={S.caption}>{item.nota}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Despesa com Pessoal */}
        <section id="pessoal" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Despesa com pessoal 2020–{anoAtual}</p>
                <h2 style={S.h2}>Folha de pagamento como % da RCL ajustada</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O limite legal para o Executivo Municipal é 54% da RCL ajustada usada pelo RGF
                  (LRF art. 20, III, b).
                  O limite prudencial é 95% desse valor (≈51,3%) e o de alerta é 90% (≈48,6%).
                  Ultrapassar o limite prudencial veda novos reajustes e criação de cargos.
                </p>

                <div style={S.borderTop}>
                  {pessoalSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>{fmt(r.dtp)}</span>
                        <span className="font-mono" style={{ fontSize: "13px", color: r.dtp_pct_rcl >= 48.6 ? "#f1c21b" : "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "56px", textAlign: "right" }}>
                          {r.dtp_pct_rcl.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <DadoQueMostra items={pessoalInsights} />
              </div>

              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>% da RCL ajustada com pessoal por ano — limite: 54%</p>
                <PctRclChart
                  data={pessoalChartData}
                  limite={54}
                  limiteLabel="Limite LRF 54%"
                  limitePrudencial={51.3}
                />
                <div className="mt-4 p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                  <p style={{ ...S.caption, lineHeight: "18px" }}>
                    <strong style={{ color: "var(--text-02)" }}>Ativo vs. Inativo:</strong>{" "}
                    Em {anoAtual}, {fmt(pessoalAtual?.pessoal_ativo ?? 0)} foram com pessoal ativo
                    (servidores em exercício) e {fmt(pessoalAtual?.pessoal_inativo ?? 0)} com inativos
                    e pensionistas do RPPS. Obrigações patronais estão incluídas no pessoal ativo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dívida */}
        <section id="divida" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Dívida consolidada 2020–{anoAtual}</p>
                <h2 style={S.h2}>Endividamento como % da base ajustada</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O limite máximo é 120% da base ajustada informada no RGF
                  (Resolução do Senado Federal 40/2001).
                  A Dívida Consolidada Líquida (DCL) desconta as disponibilidades de caixa —
                  em 2020 e 2021, o caixa superava a dívida, resultando em DCL negativa.
                </p>

                <div style={S.borderTop}>
                  {dividaSerie.slice().reverse().map((r) => (
                    <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          bruta {fmt(r.dc_bruta)}
                        </span>
                        <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "56px", textAlign: "right" }}>
                          {r.dc_pct_rcl.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <DadoQueMostra items={dividaInsights} />
              </div>

              <div>
                <p style={{ ...S.label, marginBottom: "12px" }}>DC bruta % da base ajustada por ano — limite: 120%</p>
                <PctRclChart
                  data={dividaChartData}
                  limite={120}
                  limiteLabel="Limite Senado 120%"
                  barColor="#78a9ff"
                />
                {dividaAtual && (
                  <div className="mt-4 p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                    <p style={{ ...S.caption, lineHeight: "18px", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--text-02)" }}>Composição da dívida {anoAtual}:</strong>
                    </p>
                    {[
                      { label: "Empréstimos (total)",    valor: dividaAtual.emprestimos    },
                      { label: "  — internos",           valor: dividaAtual.emp_internos   },
                      { label: "  — externos",           valor: dividaAtual.emp_externos   },
                      { label: "Financiamentos",         valor: dividaAtual.financiamentos },
                      { label: "Precatórios vencidos",   valor: dividaAtual.precatorios    },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-1" style={{ borderTop: "1px solid var(--border-01)" }}>
                        <span style={{ ...S.caption, color: item.label.startsWith("  ") ? "var(--text-04)" : "var(--text-03)", paddingLeft: item.label.startsWith("  ") ? "12px" : "0" }}>{item.label.trim()}</span>
                        <span style={{ ...S.caption, color: "var(--text-02)" }}>{fmt(item.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 mt-1" style={{ borderTop: "1px solid var(--border-02)" }}>
                      <span style={{ ...S.caption, color: "var(--text-03)", fontWeight: 600 }}>Passivo atuarial RPPS*</span>
                      <span style={{ ...S.caption, color: "var(--text-02)", fontWeight: 600 }}>{fmt(dividaAtual.passivo_atuarial)}</span>
                    </div>
                    <p style={{ ...S.caption, marginTop: "6px", color: "var(--text-04)" }}>
                      * Não computa no limite do Senado, mas representa obrigação previdenciária futura.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RPPS */}
        <section id="rpps" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Previdência dos servidores (RPPS) 2020–{anoAtual}</p>
                <h2 style={S.h2}>Fluxo previdenciário: contribuições vs. aposentadorias</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  O RPPS (Regime Próprio de Previdência Social) cobre os servidores municipais efetivos.
                  Enquanto houver mais contribuições do que benefícios pagos, o resultado é superávit.
                  Em 2024, Sorocaba entrou em déficit previdenciário pela primeira vez na série — sinal
                  de que o fundo começa a pagar mais aposentadorias do que arrecada.
                </p>
                <div style={S.borderTop}>
                  {rppsSerie.slice().reverse().map((r) => {
                    const isDeficit = r.resultado_rpps < 0
                    return (
                      <div key={r.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                        <span style={{ fontSize: "13px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                          {r.ano}
                        </span>
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                            rec. {fmt(r.total_receitas_rpps)} · desp. {fmt(r.total_despesas_rpps)}
                          </span>
                          <span className="font-mono" style={{ fontSize: "13px", color: isDeficit ? "#da1e28" : "#24a148", fontWeight: r.ano === anoAtual ? 600 : 400, minWidth: "100px", textAlign: "right" }}>
                            {isDeficit ? "▼" : "▲"} {fmt(Math.abs(r.resultado_rpps))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4" style={S.caption}>
                  Resultado = Total Receitas RPPS − Total Despesas RPPS (RREO Anexo 04 · 6º bimestre).
                  Verde = superávit · Vermelho = déficit.
                </p>
              </div>

              <div>
                {rppsAtual && (
                  <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", padding: "20px" }}>
                    <p style={{ ...S.label, marginBottom: "16px" }}>Composição do fluxo RPPS — {anoAtual}</p>
                    {[
                      { label: "Contrib. dos segurados",  valor: rppsAtual.contribuicoes_segurados, cor: "var(--text-02)" },
                      { label: "Contrib. patronal",       valor: rppsAtual.contribuicoes_patronal,  cor: "var(--text-02)" },
                      { label: "Total Receitas RPPS",     valor: rppsAtual.total_receitas_rpps,     cor: "var(--text-01)", bold: true },
                      { label: "Aposentadorias",          valor: rppsAtual.aposentadorias,          cor: "var(--text-02)" },
                      { label: "Total Despesas RPPS",     valor: rppsAtual.total_despesas_rpps,     cor: "var(--text-01)", bold: true },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-2" style={{ borderTop: "1px solid var(--border-01)" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-03)", fontWeight: (item as { bold?: boolean }).bold ? 600 : 400 }}>{item.label}</span>
                        <span className="font-mono" style={{ fontSize: "13px", color: item.cor, fontWeight: (item as { bold?: boolean }).bold ? 600 : 400 }}>{fmt(item.valor)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid var(--border-02)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-02)", fontWeight: 600 }}>Resultado RPPS {anoAtual}</span>
                      <span className="font-mono" style={{ fontSize: "14px", color: rppsAtual.resultado_rpps < 0 ? "#da1e28" : "#24a148", fontWeight: 600 }}>
                        {rppsAtual.resultado_rpps < 0 ? "▼ " : "▲ "}{fmt(Math.abs(rppsAtual.resultado_rpps))}
                      </span>
                    </div>
                    <p style={{ ...S.caption, marginTop: "12px" }}>
                      O passivo atuarial acumulado ({fmt(dividaAtual?.passivo_atuarial ?? 0)}) representa
                      obrigações futuras com aposentadorias ainda não pagas — risco fiscal de longo prazo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* RCL detalhada */}
        <section id="rcl" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">

              <div>
                <p className="uppercase font-semibold mb-4" style={S.label}>Receitas Correntes {anoAtual}</p>
                <h2 style={S.h2}>De onde vêm as receitas correntes do município</h2>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  As receitas correntes brutas, antes das deduções obrigatórias para o FUNDEB e RPPS
                  que resultam na RCL e nas bases ajustadas usadas nos limites da LRF. Em {anoAtual}, a RCL oficial foi{" "}
                  {pessoalAtual ? <strong style={{ color: "var(--text-01)" }}>{fmt(pessoalAtual.rcl)}</strong> : "—"}.
                </p>
                <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                  O ISS é o principal tributo municipal — reflexo da economia de serviços de Sorocaba.
                  O ICMS (repasse estadual) supera o ISS em municípios de base industrial.
                  Receitas de serviços (R${rclAtual ? Math.round(rclAtual.receita_servicos / 1e6) : "—"} mi) e
                  patrimonial (R${rclAtual ? Math.round(rclAtual.receita_patrimonial / 1e6) : "—"} mi) completam o quadro.
                </p>

                {/* Mini-tabela composição */}
                {rclAtual && (
                  <div style={S.borderTop}>
                    {[
                      { label: "ISS",               valor: rclAtual.iss                  },
                      { label: "ICMS cota-parte",   valor: rclAtual.icms                 },
                      { label: "IPTU",              valor: rclAtual.iptu                 },
                      { label: "FUNDEB",            valor: rclAtual.fundeb               },
                      { label: "Receita de Serviços",valor: rclAtual.receita_servicos    },
                      { label: "Receita Patrimonial",valor: rclAtual.receita_patrimonial },
                      { label: "IPVA cota-parte",   valor: rclAtual.ipva                 },
                      { label: "Contribuições (COSIP etc.)", valor: rclAtual.receita_contribuicoes },
                      { label: "IRRF",              valor: rclAtual.irrf                 },
                      { label: "Outras transf.",    valor: rclAtual.outras_transferencias },
                      { label: "Demais transferências", valor: outrasTransferenciasMenores },
                      { label: "ITBI",              valor: rclAtual.itbi                 },
                      { label: "FPM",               valor: rclAtual.fpm                  },
                      { label: "Outras correntes",  valor: rclAtual.outras_correntes     },
                      { label: "Outros tributos",   valor: rclAtual.outras_tributarias   },
                    ].filter((item) => item.valor > 0).sort((a, b) => b.valor - a.valor).map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2" style={S.borderBottom}>
                        <span style={{ fontSize: "13px", color: "var(--text-02)" }}>{item.label}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ fontSize: "11px", color: "var(--text-04)" }}>
                            {(item.valor / rclAtual.receitas_correntes * 100).toFixed(1)}%
                          </span>
                          <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", minWidth: "90px", textAlign: "right" }}>
                            {fmt(item.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2">
                      <span style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>Receitas Correntes</span>
                      <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>
                        {fmt(rclAtual.receitas_correntes)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ minHeight: "320px" }}>
                <p style={{ ...S.label, marginBottom: "12px" }}>Receitas Correntes — composição {anoAtual}</p>
                <DonutFuncoes data={donutData} />
                <p className="mt-2" style={S.caption}>
                  Receitas brutas antes das deduções LRF. Fonte: RREO Anexo 03, SICONFI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Evolução da RCL série */}
        <section id="serie-rcl" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Evolução 2020–{anoAtual}</p>
            <h2 style={S.h2}>ISS, ICMS e IPTU ao longo do tempo</h2>
            <p style={{ ...S.body, marginBottom: "24px", maxWidth: "640px" }}>
              Série histórica dos principais tributos e transferências das receitas correntes de Sorocaba.
            </p>

            {/* Tabela série */}
            <div className="overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-02)" }}>
                    {["Ano", "Rec. Correntes", "ISS", "ICMS cota", "IPTU", "ITBI", "IRRF", "FPM", "FUNDEB"].map((h) => (
                      <th key={h} style={{ ...S.label, padding: "8px 12px", textAlign: h === "Ano" ? "left" : "right", fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rclSerie.slice().reverse().map((r) => (
                    <tr key={r.ano} style={{
                      borderBottom: "1px solid var(--border-01)",
                      backgroundColor: r.ano === anoAtual ? "var(--bg-raised)" : "transparent",
                    }}>
                      <td style={{ padding: "10px 12px", color: r.ano === anoAtual ? "var(--blue-40)" : "var(--text-02)", fontWeight: r.ano === anoAtual ? 600 : 400 }}>
                        {r.ano}
                      </td>
                      {[r.receitas_correntes, r.iss, r.icms, r.iptu, r.itbi, r.irrf, r.fpm, r.fundeb].map((v, i) => (
                        <td key={i} className="font-mono" style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                          {fmt(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4" style={S.caption}>
              Fonte: RREO Anexo 03 · 6º bimestre · SICONFI/Tesouro Nacional · IBGE 3552205
            </p>
          </div>
        </section>

        {/* Contexto LRF */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Limite de pessoal (LRF)</p>
                <p style={S.body}>
                  A LRF (LC 101/2000) limita a despesa com pessoal a 60% da RCL ajustada para o município
                  inteiro, distribuída em 54% para o Executivo e 6% para a Câmara Municipal.
                  O cálculo é feito sobre os últimos 12 meses de competência.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Limite de dívida (Senado)</p>
                <p style={S.body}>
                  A Resolução SF 40/2001 fixa o limite de endividamento em 120% da base ajustada informada no RGF.
                  Municípios acima do limite ficam proibidos de contratar novas operações de crédito
                  até retornar abaixo do teto — o chamado &ldquo;excesso de dívida&rdquo;.
                </p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Passivo atuarial do RPPS</p>
                <p style={S.body}>
                  O passivo atuarial representa a diferença entre o valor presente das obrigações
                  futuras com aposentadoria dos servidores e os ativos do fundo previdenciário.
                  Não compõe o limite do Senado, mas é o maior risco fiscal estrutural de longo
                  prazo para a maioria dos municípios brasileiros.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
