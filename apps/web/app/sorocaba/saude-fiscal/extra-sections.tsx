import { DonutFuncoes, type DonutPoint } from "@/components/charts/DonutFuncoes"
import {
  getAvailableYearsFiscal,
  loadDividaDetalhada,
  loadPessoal,
  loadRclDetalhada,
  loadRpps,
  type RclDetalhadaRow,
  type RppsRow,
} from "@/lib/data"

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2: { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function fmt(value: number): string {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (value >= 1e6) return `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} mi`
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function SorocabaSaudeFiscalExtraSections() {
  const anos = getAvailableYearsFiscal("sorocaba")
  const anoAtual = anos[0] ?? 2025

  const pessoalAtual = loadPessoal(anoAtual, "sorocaba")
  const dividaAtual = loadDividaDetalhada(anoAtual, "sorocaba")
  const rclSerie: RclDetalhadaRow[] = anos
    .map((ano) => loadRclDetalhada(ano, "sorocaba"))
    .filter((row): row is RclDetalhadaRow => row !== null)
    .sort((a, b) => a.ano - b.ano)
  const rppsSerie: RppsRow[] = anos
    .map((ano) => loadRpps(ano, "sorocaba"))
    .filter((row): row is RppsRow => row !== null)
    .sort((a, b) => a.ano - b.ano)

  const rclAtual = rclSerie.find((row) => row.ano === anoAtual)
  const rppsAtual = rppsSerie.find((row) => row.ano === anoAtual)
  const transferenciasIdentificadas = rclAtual
    ? rclAtual.fpm + rclAtual.icms + rclAtual.ipva + rclAtual.fundeb + rclAtual.outras_transferencias
    : 0
  const outrasTransferenciasMenores = rclAtual
    ? Math.max(0, rclAtual.transferencias_total - transferenciasIdentificadas)
    : 0
  const donutData: DonutPoint[] = rclAtual ? [
    { nome: "ISS", valor: rclAtual.iss, color: "#0f62fe" },
    { nome: "ICMS", valor: rclAtual.icms, color: "#4589ff" },
    { nome: "IPTU", valor: rclAtual.iptu, color: "#78a9ff" },
    { nome: "FUNDEB", valor: rclAtual.fundeb, color: "#a6c8ff" },
    { nome: "IPVA", valor: rclAtual.ipva, color: "#6929c4" },
    { nome: "Serviços", valor: rclAtual.receita_servicos, color: "#42be65" },
    { nome: "Patrimonial", valor: rclAtual.receita_patrimonial, color: "#24a148" },
    { nome: "Contrib./COSIP", valor: rclAtual.receita_contribuicoes, color: "#f1c21b" },
    {
      nome: "Outros",
      valor: rclAtual.irrf + rclAtual.itbi + rclAtual.fpm + rclAtual.outras_tributarias
        + rclAtual.outras_transferencias + rclAtual.outras_correntes + rclAtual.outros,
      color: "#525252",
    },
  ].filter((item) => item.valor > 0).sort((a, b) => b.valor - a.valor) : []

  return (
    <>
      <section id="rpps" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
        <div className="mx-auto px-6 py-12" style={S.container}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div>
              <p className="uppercase font-semibold mb-4" style={S.label}>Previdência dos servidores (RPPS) 2020-{anoAtual}</p>
              <h2 style={S.h2}>Fluxo previdenciário: contribuições vs. aposentadorias</h2>
              <p style={{ ...S.body, marginBottom: "16px" }}>
                O RPPS cobre os servidores municipais efetivos. Enquanto houver mais contribuições do que benefícios pagos,
                o resultado é superávit. Em 2024, Sorocaba entrou em déficit previdenciário pela primeira vez na série.
              </p>
              <div style={S.borderTop}>
                {rppsSerie.slice().reverse().map((row) => {
                  const isDeficit = row.resultado_rpps < 0
                  return (
                    <div key={row.ano} className="flex items-center justify-between py-3" style={S.borderBottom}>
                      <span style={{ fontSize: "13px", color: row.ano === anoAtual ? "var(--blue-40)" : "var(--text-03)", fontWeight: row.ano === anoAtual ? 600 : 400 }}>
                        {row.ano}
                      </span>
                      <div className="flex items-center gap-4">
                        <span style={{ fontSize: "12px", color: "var(--text-04)" }}>
                          rec. {fmt(row.total_receitas_rpps)} · desp. {fmt(row.total_despesas_rpps)}
                        </span>
                        <span className="font-mono" style={{ fontSize: "13px", color: isDeficit ? "#da1e28" : "#24a148", fontWeight: row.ano === anoAtual ? 600 : 400, minWidth: "100px", textAlign: "right" }}>
                          {isDeficit ? "▼" : "▲"} {fmt(Math.abs(row.resultado_rpps))}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-4" style={S.caption}>
                Resultado = Total Receitas RPPS - Total Despesas RPPS (RREO Anexo 04, 6º bimestre).
              </p>
            </div>

            <div>
              {rppsAtual && (
                <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", padding: "20px" }}>
                  <p style={{ ...S.label, marginBottom: "16px" }}>Composição do fluxo RPPS — {anoAtual}</p>
                  {[
                    { label: "Contrib. dos segurados", valor: rppsAtual.contribuicoes_segurados },
                    { label: "Contrib. patronal", valor: rppsAtual.contribuicoes_patronal },
                    { label: "Total Receitas RPPS", valor: rppsAtual.total_receitas_rpps, bold: true },
                    { label: "Aposentadorias", valor: rppsAtual.aposentadorias },
                    { label: "Total Despesas RPPS", valor: rppsAtual.total_despesas_rpps, bold: true },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2" style={{ borderTop: "1px solid var(--border-01)" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-03)", fontWeight: item.bold ? 600 : 400 }}>{item.label}</span>
                      <span className="font-mono" style={{ fontSize: "13px", color: item.bold ? "var(--text-01)" : "var(--text-02)", fontWeight: item.bold ? 600 : 400 }}>{fmt(item.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 mt-1" style={{ borderTop: "2px solid var(--border-02)" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-02)", fontWeight: 600 }}>Resultado RPPS {anoAtual}</span>
                    <span className="font-mono" style={{ fontSize: "14px", color: rppsAtual.resultado_rpps < 0 ? "#da1e28" : "#24a148", fontWeight: 600 }}>
                      {rppsAtual.resultado_rpps < 0 ? "▼ " : "▲ "}{fmt(Math.abs(rppsAtual.resultado_rpps))}
                    </span>
                  </div>
                  <p style={{ ...S.caption, marginTop: "12px" }}>
                    O passivo atuarial acumulado ({fmt(dividaAtual?.passivo_atuarial ?? 0)}) representa obrigações futuras com aposentadorias ainda não pagas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="rcl-detalhada" style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
        <div className="mx-auto px-6 py-12" style={S.container}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
            <div>
              <p className="uppercase font-semibold mb-4" style={S.label}>Receitas Correntes {anoAtual}</p>
              <h2 style={S.h2}>De onde vêm as receitas correntes do município</h2>
              <p style={{ ...S.body, marginBottom: "16px" }}>
                As receitas correntes brutas antecedem as deduções obrigatórias que resultam na RCL e nas bases ajustadas usadas nos limites da LRF.
                Em {anoAtual}, a RCL oficial foi {pessoalAtual ? <strong style={{ color: "var(--text-01)" }}>{fmt(pessoalAtual.rcl)}</strong> : "—"}.
              </p>
              <p style={{ ...S.body, color: "var(--text-03)", marginBottom: "16px" }}>
                O ISS é o principal tributo municipal, reflexo da economia de serviços de Sorocaba.
                Receitas de serviços (R${rclAtual ? Math.round(rclAtual.receita_servicos / 1e6) : "—"} mi) e
                patrimonial (R${rclAtual ? Math.round(rclAtual.receita_patrimonial / 1e6) : "—"} mi) completam o quadro.
              </p>

              {rclAtual && (
                <div style={S.borderTop}>
                  {[
                    { label: "ISS", valor: rclAtual.iss },
                    { label: "ICMS cota-parte", valor: rclAtual.icms },
                    { label: "IPTU", valor: rclAtual.iptu },
                    { label: "FUNDEB", valor: rclAtual.fundeb },
                    { label: "Receita de Serviços", valor: rclAtual.receita_servicos },
                    { label: "Receita Patrimonial", valor: rclAtual.receita_patrimonial },
                    { label: "IPVA cota-parte", valor: rclAtual.ipva },
                    { label: "Contribuições (COSIP etc.)", valor: rclAtual.receita_contribuicoes },
                    { label: "IRRF", valor: rclAtual.irrf },
                    { label: "Outras transf.", valor: rclAtual.outras_transferencias },
                    { label: "Demais transferências", valor: outrasTransferenciasMenores },
                    { label: "ITBI", valor: rclAtual.itbi },
                    { label: "FPM", valor: rclAtual.fpm },
                    { label: "Outras correntes", valor: rclAtual.outras_correntes },
                    { label: "Outros tributos", valor: rclAtual.outras_tributarias },
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
                    <span className="font-mono" style={{ fontSize: "13px", color: "var(--text-01)", fontWeight: 600 }}>{fmt(rclAtual.receitas_correntes)}</span>
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

      <section id="serie-rcl" style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
        <div className="mx-auto px-6 py-12" style={S.container}>
          <p className="uppercase font-semibold mb-2" style={S.label}>Evolução 2020-{anoAtual}</p>
          <h2 style={S.h2}>ISS, ICMS e IPTU ao longo do tempo</h2>
          <p style={{ ...S.body, marginBottom: "24px", maxWidth: "640px" }}>
            Série histórica dos principais tributos e transferências das receitas correntes de Sorocaba.
          </p>

          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-02)" }}>
                  {["Ano", "Rec. Correntes", "ISS", "ICMS cota", "IPTU", "ITBI", "IRRF", "FPM", "FUNDEB"].map((heading) => (
                    <th key={heading} style={{ ...S.label, padding: "8px 12px", textAlign: heading === "Ano" ? "left" : "right", fontWeight: 600 }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rclSerie.slice().reverse().map((row) => (
                  <tr key={row.ano} style={{ borderBottom: "1px solid var(--border-01)", backgroundColor: row.ano === anoAtual ? "var(--bg-raised)" : "transparent" }}>
                    <td style={{ padding: "10px 12px", color: row.ano === anoAtual ? "var(--blue-40)" : "var(--text-02)", fontWeight: row.ano === anoAtual ? 600 : 400 }}>
                      {row.ano}
                    </td>
                    {[row.receitas_correntes, row.iss, row.icms, row.iptu, row.itbi, row.irrf, row.fpm, row.fundeb].map((value, index) => (
                      <td key={index} className="font-mono" style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-02)", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4" style={S.caption}>
            Fonte: RREO Anexo 03, 6º bimestre, SICONFI/Tesouro Nacional, IBGE 3552205.
          </p>
        </div>
      </section>

      <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
        <div className="mx-auto px-6 py-12" style={S.container}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="uppercase font-semibold mb-3" style={S.label}>Limite de pessoal (LRF)</p>
              <p style={S.body}>
                A LRF limita a despesa com pessoal a 60% da RCL ajustada para o município inteiro,
                distribuída em 54% para o Executivo e 6% para a Câmara Municipal.
              </p>
            </div>
            <div>
              <p className="uppercase font-semibold mb-3" style={S.label}>Limite de dívida (Senado)</p>
              <p style={S.body}>
                A Resolução SF 40/2001 fixa o limite de endividamento em 120% da base ajustada informada no RGF.
                Municípios acima do limite ficam proibidos de contratar novas operações de crédito.
              </p>
            </div>
            <div>
              <p className="uppercase font-semibold mb-3" style={S.label}>Passivo atuarial do RPPS</p>
              <p style={S.body}>
                O passivo atuarial representa obrigações futuras com aposentadoria dos servidores.
                Não compõe o limite do Senado, mas é risco fiscal estrutural de longo prazo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
