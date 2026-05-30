"use client"

import { useState } from "react"
import { Sankey, Tooltip, ResponsiveContainer } from "recharts"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { FLUXO_MUNICIPIOS, type FluxoSankeyNode } from "@/lib/generated/fluxo-data"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(2).replace(".", ",")} B`
  return `R$ ${v} M`
}

function pct(v: number, total: number): string {
  return `${((v / total) * 100).toFixed(1)}%`
}

// ─── Sankey node customizado ──────────────────────────────────────────────────
// Recharts passa x, y, width, height, payload (= objeto original do nó).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FluxoNode(props: any) {
  const { x, y, width, height, payload } = props
  if (!payload) return null
  const node = payload as FluxoSankeyNode
  const gap = 10
  const midY = y + height / 2
  const lineH = Math.max(7, Math.min(10, height / 4))

  if (node.side === "center") {
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={node.color} fillOpacity={0.9} rx={1} />
        <text x={x + width / 2} y={y - 12} textAnchor="middle" fill="#c6c6c6" fontSize={12} fontWeight={600}>
          {node.shortName}
        </text>
        <text x={x + width / 2} y={y + height + 16} textAnchor="middle" fill="#8d8d8d" fontSize={10}>
          {fmtM(node.valueM)}
        </text>
      </g>
    )
  }

  const isSource = node.side === "source"
  const tx = isSource ? x - gap : x + width + gap
  const anchor = isSource ? "end" : "start"

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={node.color} fillOpacity={0.82} rx={1} />
      <text x={tx} y={midY - lineH} textAnchor={anchor} fill="#c6c6c6" fontSize={11}>
        {node.shortName}
      </text>
      <text x={tx} y={midY + lineH} textAnchor={anchor} fill="#8d8d8d" fontSize={10}>
        {fmtM(node.valueM)}
      </text>
    </g>
  )
}

// ─── Sankey link customizado ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FluxoLink(props: any) {
  const { sourceX, sourceY, sourceControlX, targetControlX, targetX, targetY, linkWidth, payload } = props
  if (!payload || linkWidth === 0) return null
  const sourceColor: string = (payload.source as FluxoSankeyNode)?.color ?? "#525252"
  const half = linkWidth / 2
  const d = [
    `M${sourceX},${sourceY + half}`,
    `C${sourceControlX},${sourceY + half}`,
    ` ${targetControlX},${targetY + half}`,
    ` ${targetX},${targetY + half}`,
    `L${targetX},${targetY - half}`,
    `C${targetControlX},${targetY - half}`,
    ` ${sourceControlX},${sourceY - half}`,
    ` ${sourceX},${sourceY - half}`,
    "Z",
  ].join(" ")
  return <path d={d} fill={sourceColor} fillOpacity={0.22} stroke={sourceColor} strokeOpacity={0.12} strokeWidth={0.5} />
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FluxoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const name: string = item.name ?? item.payload?.name ?? ""
  const val: number = item.value ?? item.payload?.value ?? 0
  return (
    <div className="rounded border border-[var(--border-01)] bg-[var(--bg-raised)] px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[var(--text-01)]">{name}</p>
      <p className="mt-0.5 font-mono text-[var(--text-03)]">{fmtM(val)}</p>
    </div>
  )
}

// ─── Legenda ──────────────────────────────────────────────────────────────────
const SOURCE_LEGEND = [
  { color: "#4589ff", label: "União Federal" },
  { color: "#a78bfa", label: "Estado de SP" },
  { color: "#42be65", label: "Rec. Própria" },
  { color: "#78716c", label: "Outros" },
]

// ─── Card resumo ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded border border-[var(--border-01)] bg-[var(--bg-elevated)] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">{label}</p>
      <p className="mt-1 font-mono text-base text-[var(--text-01)]">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--text-04)]">{sub}</p>}
    </div>
  )
}

// ─── Fallback mobile ──────────────────────────────────────────────────────────
function MobileSection({ title, nodes, total }: { title: string; nodes: FluxoSankeyNode[]; total: number }) {
  return (
    <div className="rounded border border-[var(--border-01)] bg-[var(--bg-elevated)] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">{title}</p>
      <div className="space-y-3">
        {nodes.map((n) => (
          <div key={n.name} className="flex items-center gap-3">
            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: n.color }} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-xs">
                <span className="truncate text-[var(--text-02)]">{n.shortName}</span>
                <span className="ml-2 flex-shrink-0 font-mono text-[var(--text-03)]">{fmtM(n.valueM)}</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-[var(--bg-raised)]">
                <div
                  className="h-1 rounded-full"
                  style={{ width: pct(n.valueM, total), backgroundColor: n.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FluxoFinanceiroPage() {
  const [activeId, setActiveId] = useState("sorocaba")
  const entry = FLUXO_MUNICIPIOS.find((m) => m.id === activeId)!

  const sourceNodes = entry.data.nodes.filter((n) => n.side === "source")
  const useNodes = entry.data.nodes.filter((n) => n.side === "use")
  const totalM = entry.totalLiquidadoM

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-01)]">
      <ShellHeader />
      <main className="flex-1">

        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <section className="border-b border-[var(--border-01)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-04)]">
              <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)]" />
              Transparência fiscal · {entry.anoReferencia || "—"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Rastro do dinheiro público
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-03)]">
              De onde vem e como é gasto o orçamento municipal. Cada faixa representa
              volume real de recursos — quanto mais larga, maior o montante.
            </p>

            {/* Seletor de município */}
            <div className="mt-6 flex flex-wrap gap-2">
              {FLUXO_MUNICIPIOS.map((m) => {
                const active = activeId === m.id
                const pending = m.status === "pending"
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={pending}
                    onClick={() => setActiveId(m.id)}
                    className={`flex items-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition
                      ${active
                        ? "border-[var(--theme-accent)] bg-[var(--theme-accent)] text-white"
                        : pending
                          ? "cursor-not-allowed border-[var(--border-01)] text-[var(--text-04)]"
                          : "border-[var(--border-01)] text-[var(--text-03)] hover:border-[var(--border-02)] hover:text-[var(--text-01)]"
                      }`}
                  >
                    {m.nome}/{m.uf}
                    {pending && (
                      <span className="rounded bg-[var(--support-warning)]/20 px-1 py-0.5 text-[9px] font-medium text-[var(--support-warning)]">
                        em breve
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Conteúdo ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-8">

          {/* Cards resumo */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard
              label="Receita arrecadada"
              value={fmtM(entry.totalReceitaM)}
              sub={entry.anoReferencia ? `exercício ${entry.anoReferencia}` : undefined}
            />
            <SummaryCard
              label="Despesa liquidada"
              value={fmtM(entry.totalLiquidadoM)}
              sub="base do fluxo abaixo"
            />
            <SummaryCard
              label="Maior gasto"
              value={entry.data.nodes.filter((n) => n.side === "use").sort((a, b) => b.valueM - a.valueM)[0]?.shortName ?? "—"}
              sub={fmtM(entry.data.nodes.filter((n) => n.side === "use").sort((a, b) => b.valueM - a.valueM)[0]?.valueM ?? 0)}
            />
            <SummaryCard
              label="Maior fonte"
              value={entry.data.nodes.filter((n) => n.side === "source").sort((a, b) => b.valueM - a.valueM)[0]?.shortName ?? "—"}
              sub={fmtM(entry.data.nodes.filter((n) => n.side === "source").sort((a, b) => b.valueM - a.valueM)[0]?.valueM ?? 0)}
            />
          </div>

          {/* ── Sankey desktop ─────────────────────────────────────────── */}
          {entry.data.nodes.length > 0 ? (
            <>
              <div className="hidden md:block rounded border border-[var(--border-01)] bg-[var(--bg-elevated)]">
                {/* Legenda */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-01)] px-4 py-2 text-[11px] text-[var(--text-04)]">
                  <span className="flex flex-wrap gap-4">
                    {SOURCE_LEGEND.map((l) => (
                      <span key={l.label} className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </span>
                  <span>hover para detalhes · valores em R$ milhões</span>
                </div>

                {/* Diagrama */}
                <div className="px-2 py-4">
                  <ResponsiveContainer width="100%" height={520}>
                    <Sankey
                      data={entry.data}
                      node={<FluxoNode />}
                      link={<FluxoLink />}
                      nodePadding={14}
                      nodeWidth={18}
                      margin={{ top: 24, right: 160, bottom: 24, left: 160 }}
                      iterations={64}
                    >
                      <Tooltip content={<FluxoTooltip />} />
                    </Sankey>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── Fallback mobile ────────────────────────────────────── */}
              <div className="space-y-4 md:hidden">
                <MobileSection title="De onde vem" nodes={sourceNodes} total={totalM} />
                <div className="text-center text-sm text-[var(--text-04)]">
                  ↓ orçamento de {entry.nome}/{entry.uf} — {fmtM(totalM)} liquidados ↓
                </div>
                <MobileSection title="Como é gasto" nodes={useNodes} total={totalM} />
              </div>
            </>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded border border-[var(--border-01)] bg-[var(--bg-elevated)] text-sm text-[var(--text-04)]">
              Dados em coleta — disponível em breve.
            </div>
          )}

          {/* Citação da fonte */}
          {entry.fonte && (
            <p className="mt-5 text-[10px] leading-5 text-[var(--text-04)]">
              <span className="font-semibold text-[var(--text-03)]">Fonte:</span> {entry.fonte}
            </p>
          )}
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
