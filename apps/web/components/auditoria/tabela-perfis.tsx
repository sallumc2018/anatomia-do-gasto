import { getAgentesPorGrupo, getCustoMensalTotal, type Agente } from "@/lib/auditoria"

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function GrupoTabela({ titulo, agentes }: { titulo: string; agentes: Agente[] }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-02)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border-01)" }}>
        {titulo}
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", tableLayout: "auto" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
            <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--text-02)" }}>Nome</th>
            <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--text-02)" }}>Cargo</th>
            <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--text-02)" }}>Partido</th>
            <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--text-02)" }}>Mandato</th>
            <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "var(--text-02)" }}>Subsídio bruto/mês</th>
          </tr>
        </thead>
        <tbody>
          {agentes.map((a) => (
            <tr key={a.id} style={{ borderBottom: "1px solid var(--border-01)" }}>
              <td style={{ padding: "12px 16px", color: "var(--text-01)", fontWeight: 500 }}>
                {a.nome_publico ?? a.nome}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-02)" }}>{a.cargo}</td>
              <td style={{ padding: "12px 16px", color: "var(--text-02)" }}>{a.partido}</td>
              <td style={{ padding: "12px 16px", color: "var(--text-03)", fontSize: "13px" }}>{a.mandato}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", color: "var(--text-01)", fontWeight: 500 }}>
                {fmt(a.salario_bruto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function TabelaPerfis() {
  const { executivo, legislativo } = getAgentesPorGrupo()
  const custoTotal = getCustoMensalTotal()

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "640px" }}>
          <GrupoTabela titulo="Poder Executivo Municipal" agentes={executivo} />
          <GrupoTabela titulo={`Câmara Municipal — ${legislativo.length} Vereadores (19ª Legislatura)`} agentes={legislativo} />
        </div>
      </div>
      <div style={{ marginTop: "24px", padding: "16px 20px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-03)", margin: 0 }}>
          {executivo.length + legislativo.length} agentes · subsídios brutos mensais por cargo · Sorocaba/SP · mandato 2025–2028
        </p>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-01)", fontFamily: "monospace", margin: 0 }}>
          Custo total/mês: {fmt(custoTotal)}
        </p>
      </div>
    </div>
  )
}
