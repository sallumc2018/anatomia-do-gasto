"use client"

import { useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Building2,
  Bus,
  Coins,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  Landmark,
  LayoutGrid,
  Network,
  Shield,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { MINDMAP_NODES, type GeneratedMindNode } from "@/lib/generated/mindmap-data"

type NodeGroup = "root" | "dinheiro" | "servicos" | "controle"
type ViewMode = "neural" | "blueprint"

type MindNode = {
  id: string
  parentId: string | null
  label: string
  group: NodeGroup
  icon: LucideIcon
  summary: string
  detail: string
  value: string
  href?: string
  linkLabel?: string
  color: string
  sourceCount: number
  policy: {
    publicavel: number
    publicavelComCautela: number
    naoDestacarNaUi: number
  }
}

const ICONS: Record<GeneratedMindNode["icon"], LucideIcon> = {
  ArrowRight,
  Building2,
  Bus,
  Coins,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Network,
  Shield,
  ShieldCheck,
  Workflow,
}

const NODES: MindNode[] = MINDMAP_NODES.map((node) => ({
  ...node,
  icon: ICONS[node.icon],
}))

const COORDS_NEURAL: Record<string, { x: number; y: number }> = {
  sorocaba: { x: 500, y: 300 },
  executivo: { x: 305, y: 235 },
  receita: { x: 110, y: 160 },
  fornecedores: { x: 120, y: 310 },
  servicos: { x: 500, y: 155 },
  saude: { x: 340, y: 60 },
  educacao: { x: 470, y: 48 },
  seguranca: { x: 600, y: 62 },
  transporte: { x: 715, y: 130 },
  controle: { x: 695, y: 365 },
  camara: { x: 860, y: 265 },
  contratos: { x: 870, y: 405 },
  fluxo: { x: 620, y: 525 },
}

const COORDS_BLUEPRINT: Record<string, { x: number; y: number }> = {
  sorocaba: { x: 500, y: 300 },
  executivo: { x: 280, y: 210 },
  receita: { x: 90, y: 150 },
  fornecedores: { x: 90, y: 270 },
  servicos: { x: 500, y: 150 },
  saude: { x: 330, y: 60 },
  educacao: { x: 450, y: 60 },
  seguranca: { x: 570, y: 60 },
  transporte: { x: 690, y: 60 },
  controle: { x: 720, y: 360 },
  camara: { x: 910, y: 270 },
  contratos: { x: 910, y: 390 },
  fluxo: { x: 500, y: 530 },
}

function childrenOf(id: string) {
  return NODES.filter((node) => node.parentId === id)
}

export default function MapaInterativoPage() {
  const [activeId, setActiveId] = useState("sorocaba")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>("neural")

  const coords = mode === "blueprint" ? COORDS_BLUEPRINT : COORDS_NEURAL
  const activeNode = NODES.find((node) => node.id === activeId) ?? NODES[0]
  const ActiveIcon = activeNode.icon

  const percent = (id: string) => {
    const point = coords[id] ?? { x: 500, y: 300 }
    return { left: `${point.x / 10}%`, top: `${point.y / 6}%` }
  }

  const pathFor = (parentId: string, childId: string) => {
    const parent = coords[parentId]
    const child = coords[childId]
    if (!parent || !child) return ""
    if (mode === "blueprint") {
      const mid = parent.x + (child.x - parent.x) / 2
      return `M ${parent.x},${parent.y} L ${mid},${parent.y} L ${mid},${child.y} L ${child.x},${child.y}`
    }
    const mid = parent.x + (child.x - parent.x) / 2
    return `M ${parent.x},${parent.y} C ${mid},${parent.y} ${mid},${child.y} ${child.x},${child.y}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-01)]">
      <ShellHeader />
      <main className="flex-1">
        <section className="border-b border-[var(--border-01)] bg-[var(--bg-elevated)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-04)]">
                <span className="h-2 w-2 rounded-full bg-[var(--theme-accent)]" />
                Exploração cívica interativa
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Mindmap da Anatomia do Gasto
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-03)]">
                Um mapa navegável das trilhas públicas de Sorocaba. As conexões mostram
                onde o cidadão entra para entender receita, gasto, serviços e controle.
              </p>
            </div>
            <div className="flex rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-1">
              {[
                { id: "neural", label: "Rede Neural", icon: Network },
                { id: "blueprint", label: "Blueprint", icon: LayoutGrid },
              ].map((item) => {
                const Icon = item.icon
                const selected = mode === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id as ViewMode)}
                    className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold transition ${
                      selected
                        ? "bg-[var(--theme-accent)] text-white"
                        : "text-[var(--text-03)] hover:text-[var(--text-01)]"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
          <div
            className="relative min-h-[640px] overflow-hidden rounded border border-[var(--border-01)] p-5 shadow-sm"
            style={{
              background:
                mode === "blueprint"
                  ? "linear-gradient(var(--border-01) 1px, transparent 1px), linear-gradient(90deg, var(--border-01) 1px, transparent 1px), radial-gradient(circle at 50% 50%, #101827 0%, var(--bg-base) 72%)"
                  : "radial-gradient(circle at 50% 50%, #111827 0%, var(--bg-base) 72%)",
              backgroundSize: mode === "blueprint" ? "32px 32px, 32px 32px, auto" : "auto",
            }}
          >
            <div className="relative z-20 flex items-center justify-between border-b border-[var(--border-01)] pb-3 text-[11px] text-[var(--text-03)]">
              <span className="flex items-center gap-2">
                <Network size={13} className="text-[var(--theme-accent)]" />
                Sinapses de navegação pública
              </span>
              <span className="font-mono uppercase text-[var(--text-04)]">{mode}</span>
            </div>

            <div className="relative mt-5 hidden min-h-[540px] md:block">
              <svg viewBox="0 0 1000 600" className="absolute inset-0 h-full w-full">
                {NODES.filter((node) => node.parentId).map((node) => {
                  const path = pathFor(node.parentId!, node.id)
                  const active = activeId === node.id || activeId === node.parentId || hoveredId === node.id
                  return (
                    <g key={node.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={active ? node.color : "var(--border-02)"}
                        strokeWidth={active ? 1.8 : 0.8}
                        strokeDasharray={mode === "blueprint" && !active ? "5 5" : undefined}
                        opacity={active ? 0.95 : 0.28}
                      />
                      {active && (
                        <circle r="2.2" fill={node.color}>
                          <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
                        </circle>
                      )}
                    </g>
                  )
                })}
              </svg>

              {NODES.map((node) => {
                const Icon = node.icon
                const selected = activeId === node.id
                const root = node.id === "sorocaba"
                const branch = childrenOf(node.id).length > 0 && !root
                const position = percent(node.id)
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      selected ? "scale-105" : "hover:scale-105"
                    }`}
                    style={position}
                  >
                    {root ? (
                      <span
                        className={`relative flex h-16 w-16 items-center justify-center border bg-[var(--bg-elevated)] ${
                          mode === "blueprint" ? "rounded" : "rounded-full"
                        }`}
                        style={{
                          borderColor: selected ? node.color : "var(--border-01)",
                          boxShadow: selected ? "var(--theme-glow)" : undefined,
                        }}
                      >
                        <Icon size={24} style={{ color: node.color }} />
                        <span className="absolute top-[72px] whitespace-nowrap text-xs font-semibold">
                          {node.label}
                        </span>
                      </span>
                    ) : branch ? (
                      <span
                        className={`flex items-center gap-2 border bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold ${
                          mode === "blueprint" ? "rounded" : "rounded-full"
                        }`}
                        style={{ borderColor: selected ? node.color : "var(--border-01)" }}
                      >
                        <Icon size={14} style={{ color: node.color }} />
                        {node.label}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 border ${
                            mode === "blueprint" ? "rounded-none" : "rounded-full"
                          }`}
                          style={{
                            backgroundColor: node.color,
                            borderColor: selected ? "white" : node.color,
                          }}
                        />
                        <span
                          className={`whitespace-nowrap text-[11px] ${
                            selected ? "font-semibold text-[var(--text-01)]" : "text-[var(--text-03)]"
                          }`}
                        >
                          {node.label}
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 md:hidden">
              {NODES.map((node) => {
                const Icon = node.icon
                const selected = activeId === node.id
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className={`flex items-center justify-between rounded border p-3 text-left ${
                      selected
                        ? "border-[var(--theme-accent)] bg-[var(--bg-raised)]"
                        : "border-[var(--border-01)] bg-[var(--bg-elevated)]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      <Icon size={14} style={{ color: node.color }} />
                      {node.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-04)]">{node.value}</span>
                  </button>
                )
              })}
            </div>

            <div className="relative z-20 mt-4 flex flex-wrap gap-4 border-t border-[var(--border-01)] pt-3 text-[10px] text-[var(--text-04)]">
              <span className="font-semibold text-[var(--text-03)]">Legenda</span>
              <span>dinheiro público</span>
              <span>serviços públicos</span>
              <span>controle social</span>
            </div>
          </div>

          <aside className="rounded border border-[var(--border-01)] bg-[var(--bg-elevated)] p-5">
            <div className="flex items-center justify-between border-b border-[var(--border-01)] pb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
                Nó ativo
              </p>
              <span className="rounded bg-[var(--bg-base)] px-2 py-1 text-[10px] uppercase text-[var(--text-03)]">
                {activeNode.group}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <span className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-3">
                <ActiveIcon size={22} style={{ color: activeNode.color }} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{activeNode.label}</h2>
                <p className="text-xs text-[var(--text-04)]">{activeNode.summary}</p>
              </div>
            </div>

            <div className="mt-5 rounded border border-[var(--border-01)] bg-[var(--bg-base)] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
                cobertura
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text-01)]">{activeNode.value}</p>
            </div>

            {activeNode.sourceCount > 0 && (
              <div className="mt-3 rounded border border-[var(--border-01)] bg-[var(--bg-base)] px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
                  política de UI
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <span className="rounded border border-[var(--border-01)] px-2 py-2">
                    <span className="block font-mono text-sm text-[var(--text-01)]">
                      {activeNode.policy.publicavel}
                    </span>
                    <span className="text-[10px] text-[var(--text-04)]">publicável</span>
                  </span>
                  <span className="rounded border border-[var(--border-01)] px-2 py-2">
                    <span className="block font-mono text-sm text-[var(--text-01)]">
                      {activeNode.policy.publicavelComCautela}
                    </span>
                    <span className="text-[10px] text-[var(--text-04)]">cautela</span>
                  </span>
                  <span className="rounded border border-[var(--border-01)] px-2 py-2">
                    <span className="block font-mono text-sm text-[var(--text-01)]">
                      {activeNode.policy.naoDestacarNaUi}
                    </span>
                    <span className="text-[10px] text-[var(--text-04)]">agregar</span>
                  </span>
                </div>
              </div>
            )}

            <p className="mt-5 text-sm leading-6 text-[var(--text-02)]">{activeNode.detail}</p>

            {activeNode.href && (
              <Link
                href={activeNode.href}
                className="mt-6 flex items-center justify-between rounded border border-[var(--border-01)] bg-[var(--bg-base)] px-3 py-2 text-sm font-semibold text-[var(--text-01)] hover:bg-[var(--bg-raised)]"
              >
                {activeNode.linkLabel}
                <ArrowRight size={14} />
              </Link>
            )}
          </aside>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
