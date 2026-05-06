import { getPerfisResumidos } from "@/lib/auditoria"

export default function TabelaPerfis() {
  const perfis = getPerfisResumidos()
  const officialBadge = (
    <span style={{ display: "block", marginTop: "4px", fontSize: "11px", fontWeight: 600, color: "var(--support-success)" }}>
      Oficial
    </span>
  )
  const mockBadge = (
    <span style={{ display: "block", marginTop: "4px", fontSize: "11px", fontWeight: 600, color: "var(--support-warning)" }}>
      Exemplo
    </span>
  )

  return (
    <div style={{ width: "100% !important", overflowX: "auto", minWidth: "100%" } as React.CSSProperties}>
      <table style={{ width: "100%", minWidth: "940px", borderCollapse: "collapse", fontSize: "16px", tableLayout: "auto" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
            <th style={{ textAlign: "left", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)" }}>Nome</th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)" }}>Cargo</th>
            <th style={{ textAlign: "left", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)" }}>Partido</th>
            <th style={{ textAlign: "right", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)" }}>
              Subsídio mensal
              {officialBadge}
            </th>
            <th style={{ textAlign: "right", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)", backgroundColor: "var(--bg-elevated)" }}>
              Emendas
              {mockBadge}
            </th>
            <th style={{ textAlign: "right", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)", backgroundColor: "var(--bg-elevated)" }}>
              Pago
              {mockBadge}
            </th>
            <th style={{ textAlign: "right", padding: "14px 18px", fontWeight: 600, color: "var(--text-02)", backgroundColor: "var(--bg-elevated)" }}>
              Execução
              {mockBadge}
            </th>
          </tr>
        </thead>
        <tbody>
          {perfis.map((perfil) => (
            <tr key={perfil.id} style={{ borderBottom: "1px solid var(--border-01)" }}>
              <td style={{ padding: "14px 18px", color: "var(--text-01)", fontWeight: 500 }}>{perfil.nome}</td>
              <td style={{ padding: "14px 18px", color: "var(--text-02)" }}>{perfil.cargo}</td>
              <td style={{ padding: "14px 18px", color: "var(--text-02)" }}>{perfil.partido}</td>
              <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "monospace", color: "var(--text-01)" }}>
                {perfil.salario_bruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "monospace", color: "var(--text-01)", backgroundColor: "var(--bg-elevated)" }}>
                {perfil.total_empenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "monospace", color: perfil.total_pago > 0 ? "var(--blue-40)" : "var(--text-04)", backgroundColor: "var(--bg-elevated)" }}>
                {perfil.total_pago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "14px 18px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: perfil.taxa_execucao >= 80 ? "var(--blue-40)" : perfil.taxa_execucao >= 30 ? "#f1c21b" : "#fa4d56", backgroundColor: "var(--bg-elevated)" }}>
                {perfil.taxa_execucao.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
