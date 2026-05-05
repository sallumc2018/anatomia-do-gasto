import { getPerfisResumidos, type AgentePerfil } from "@/lib/auditoria"

export default function TabelaPerfis() {
  const perfis = getPerfisResumidos()

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-01)" }}>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Nome
            </th>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Cargo
            </th>
            <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Partido
            </th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Salário Bruto
            </th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Emendas (Empenhado)
            </th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Total Pago
            </th>
            <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "var(--text-02)" }}>
              Taxa de Execução
            </th>
          </tr>
        </thead>
        <tbody>
          {perfis.map((perfil) => (
            <tr
              key={perfil.id}
              style={{ borderBottom: "1px solid var(--border-01)" }}
              className="hover:bg-gray-900"
            >
              <td style={{ padding: "12px 16px", color: "var(--text-01)" }}>{perfil.nome}</td>
              <td style={{ padding: "12px 16px", color: "var(--text-02)" }}>{perfil.cargo}</td>
              <td style={{ padding: "12px 16px", color: "var(--text-02)" }}>{perfil.partido}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-01)" }}>
                {perfil.salario_bruto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: "var(--text-01)" }}>
                {perfil.total_empenhado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: perfil.total_pago > 0 ? "var(--blue-40)" : "var(--text-04)" }}>
                {perfil.total_pago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", color: perfil.taxa_execucao >= 80 ? "var(--blue-40)" : perfil.taxa_execucao >= 30 ? "#f1c21b" : "#fa4d56" }}>
                {perfil.taxa_execucao.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}