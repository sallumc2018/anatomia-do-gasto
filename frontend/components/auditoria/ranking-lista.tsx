import { getRanking, getAgentes } from "@/lib/auditoria"

const SELO: Record<number, { emoji: string; cor: string; label: string }> = {
  100: { emoji: "🟢", cor: "var(--blue-40)", label: "Excelente" },
  70: { emoji: "🟡", cor: "#f1c21b", label: "Regular" },
  40: { emoji: "🟠", cor: "#f1c21b", label: "Atenção" },
  0:  { emoji: "🔴", cor: "#fa4d56", label: "Crítico" },
}

function getSelo(pontuacao: number) {
  if (pontuacao >= 80) return SELO[100]
  if (pontuacao >= 60) return SELO[70]
  if (pontuacao >= 30) return SELO[40]
  return SELO[0]
}

export default function RankingLista() {
  const ranking = getRanking()
  const agentes = getAgentes()

  const rankingComNomes = ranking
    .map((item) => {
      const agente = agentes.find((a) => a.id === item.agente_id)
      return { ...item, nome: agente?.nome ?? item.agente_id, cargo: agente?.cargo ?? "", partido: agente?.partido ?? "" }
    })
    .sort((a, b) => b.pontuacao - a.pontuacao)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {rankingComNomes.map((item, i) => {
        const selo = getSelo(item.pontuacao)
        return (
          <div
            key={item.agente_id}
            style={{
              border: "1px solid var(--border-01)",
              backgroundColor: "var(--bg-elevated)",
              padding: "20px 24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>{selo.emoji}</span>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-01)" }}>
                    {i + 1}º — {item.nome}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-03)" }}>
                    {item.cargo} · {item.partido}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="font-mono" style={{ fontSize: "28px", fontWeight: 500, color: selo.cor }}>
                  {item.pontuacao}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-04)" }}>pontos</p>
              </div>
            </div>
            <div style={{ height: "6px", backgroundColor: "var(--border-01)", borderRadius: "3px", marginBottom: "12px" }}>
              <div
                style={{
                  height: "6px",
                  width: `${item.pontuacao}%`,
                  backgroundColor: selo.cor,
                  borderRadius: "3px",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "12px" }}>
              {item.criterios_positivos.length > 0 && (
                <div>
                  <p style={{ color: "var(--blue-40)", fontWeight: 600, marginBottom: "4px" }}>✓ Positivos</p>
                  {item.criterios_positivos.map((c) => (
                    <p key={c} style={{ color: "var(--text-03)" }}>· {c.replace(/_/g, " ")}</p>
                  ))}
                </div>
              )}
              {item.criterios_negativos.length > 0 && (
                <div>
                  <p style={{ color: "#fa4d56", fontWeight: 600, marginBottom: "4px" }}>✗ Negativos</p>
                  {item.criterios_negativos.map((c) => (
                    <p key={c} style={{ color: "var(--text-03)" }}>· {c.replace(/_/g, " ")}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
