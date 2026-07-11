import type { Metadata } from "next"
import statusOperacional from "@/lib/status_operacional.json"
import metricasInstitucionais from "@/lib/metricas_institucionais.json"
import { PENDENCIAS, type Pendencia } from "@/lib/pendencias"
import { PEDIDOS_LAI } from "@/lib/lai-pedidos"
import LogoutButton from "./logout-button"

export const metadata: Metadata = {
  title: "Painel interno",
  robots: { index: false, follow: false },
}

const CORES_PRIORIDADE: Record<Pendencia["prioridade"], string> = {
  alta: "#dc2626",
  media: "#d97706",
  baixa: "#65a30d",
}

const CORES_AREA: Record<Pendencia["area"], string> = {
  coleta: "#2563eb",
  publicacao: "#7c3aed",
  portal: "#0891b2",
  juridico: "#be123c",
  infra: "#525252",
}

function Barra({ pct }: { pct: number }) {
  return (
    <div style={{ background: "#e5e5e5", borderRadius: 4, height: 8, width: "100%" }}>
      <div
        style={{
          background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626",
          borderRadius: 4,
          height: 8,
          width: `${Math.min(pct, 100)}%`,
        }}
      />
    </div>
  )
}

export default function AdminPage() {
  const sprint1 = Object.values(statusOperacional.sprint1) as Array<{
    nome: string
    total: number
    publicado: number
    pct: number
  }>
  const sprint2 = statusOperacional.sprint2

  const laiPorStatus = PEDIDOS_LAI.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})

  const pendenciasOrdenadas = [...PENDENCIAS].sort((a, b) => {
    const ordem = { alta: 0, media: 1, baixa: 2 }
    return ordem[a.prioridade] - ordem[b.prioridade]
  })

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Painel interno — Anatomia do Gasto</h1>
        <LogoutButton />
      </div>
      <p style={{ color: "#737373", fontSize: 13, marginBottom: 32 }}>
        Gerado em {new Date(statusOperacional._gerado_em).toLocaleString("pt-BR")} · uso interno, não indexado
      </p>

      {/* Status operacional */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Status operacional da coleta</h2>
        <p style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>
          Cobertura por município (Sprint 1) e avanço da coleta nacional (Sprint 2)
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
          {sprint1.map((m) => (
            <div key={m.nome} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{m.nome}</div>
              <Barra pct={m.pct} />
              <div style={{ fontSize: 12, color: "#737373", marginTop: 6 }}>
                {m.publicado}/{m.total} datasets publicados ({m.pct}%)
              </div>
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Brasil (Sprint 2 — 5.571 municípios)</div>
          <Barra pct={sprint2.pct} />
          <div style={{ fontSize: 12, color: "#737373", marginTop: 6 }}>
            {sprint2.coletados}/{sprint2.total_brasil} municípios com alguma coleta ({sprint2.pct}%)
          </div>
        </div>
      </section>

      {/* Pendências / roadmap */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Pendências e roadmap</h2>
        <p style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>
          Mantido manualmente em apps/web/lib/pendencias.ts — atualizar conforme o trabalho avança
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendenciasOrdenadas.map((p) => (
            <div key={p.titulo} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#fff",
                    background: CORES_PRIORIDADE[p.prioridade],
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  {p.prioridade}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#fff",
                    background: CORES_AREA[p.area],
                    borderRadius: 4,
                    padding: "2px 6px",
                  }}
                >
                  {p.area}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.titulo}</span>
              </div>
              <p style={{ fontSize: 13, color: "#404040", lineHeight: 1.5 }}>{p.descricao}</p>
              <p style={{ fontSize: 11, color: "#a3a3a3", marginTop: 6 }}>atualizado em {p.atualizadoEm}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LAI / jurídico */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Pedidos LAI</h2>
        <p style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>
          {PEDIDOS_LAI.length} pedidos cadastrados — detalhe completo em /sorocaba/acesso-a-informacao
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(laiPorStatus).map(([status, count]) => (
            <div key={status} style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{count}</div>
              <div style={{ fontSize: 11, color: "#737373", textTransform: "capitalize" }}>{status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Métricas institucionais */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Métricas institucionais</h2>
        <p style={{ fontSize: 13, color: "#737373", marginBottom: 16 }}>
          Editado manualmente em apps/web/lib/metricas_institucionais.json — não há sistema financeiro integrado
        </p>
        {metricasInstitucionais.infraCustoMensalBRL === null && metricasInstitucionais.doacoesRecebidasBRL === null ? (
          <div style={{ border: "1px dashed #d4d4d4", borderRadius: 8, padding: 16, fontSize: 13, color: "#737373" }}>
            {metricasInstitucionais.observacoes}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#737373" }}>Custo de infra/mês</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{metricasInstitucionais.infraCustoMensalBRL}</div>
            </div>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#737373" }}>Doações recebidas</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{metricasInstitucionais.doacoesRecebidasBRL}</div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
