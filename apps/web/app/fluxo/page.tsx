"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  FileCheck2,
  FileText,
  Lock,
  ShieldCheck,
  Workflow,
} from "lucide-react"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

type LayerStatus = "publico" | "interno" | "gate"

type FlowNode = {
  id: string
  label: string
  eyebrow: string
  icon: LucideIcon
  status: LayerStatus
  summary: string
  detail: string
  reads?: string
  next: string[]
}

const STATUS_LABEL: Record<LayerStatus, string> = {
  publico: "publico",
  interno: "interno",
  gate: "gate humano",
}

const FLOW_NODES: FlowNode[] = [
  {
    id: "fontes",
    label: "Fontes oficiais",
    eyebrow: "origem",
    icon: Database,
    status: "publico",
    summary: "Portais municipais, TCE-SP, SICONFI, PNCP, FNS e bases federais.",
    detail:
      "Tudo começa em fontes oficiais. A coleta pode usar API, HTML, PDF ou Playwright, mas a fonte precisa ficar documentada em manifesto.",
    next: ["raw"],
  },
  {
    id: "raw",
    label: "Acervo bruto interno",
    eyebrow: "evidencia primaria",
    icon: FileText,
    status: "interno",
    summary: "Arquivo bruto preservado fora da experiência pública do site.",
    detail:
      "Camada de evidência: PDFs, HTMLs e downloads originais. Não é publicação institucional e não alimenta o frontend.",
    next: ["extracted"],
  },
  {
    id: "extracted",
    label: "Extração técnica",
    eyebrow: "saida mecanica",
    icon: Workflow,
    status: "interno",
    summary: "Resultado automático dos extratores, ainda sujeito a erro de parsing.",
    detail:
      "Serve para trabalho técnico. Pode conter OCR imperfeito, campos excedentes ou granularidade que precisa de curadoria.",
    next: ["validated"],
  },
  {
    id: "validated",
    label: "Validação local",
    eyebrow: "aprovacao local",
    icon: FileCheck2,
    status: "gate",
    summary: "Dado revisado localmente, mas ainda não publicado por padrão.",
    detail:
      "Só vira publicação depois de validação aplicável, manifesto coerente e cópia explícita para data/public.",
    next: ["public"],
  },
  {
    id: "public",
    label: "data/public",
    eyebrow: "publicacao oficial",
    icon: CheckCircle2,
    status: "publico",
    summary: "Única camada de dados que o site oficial pode ler.",
    detail:
      "É a base pública da ONG: CSVs e JSONs já promovidos, com fonte e limites declarados em data/manifests.",
    reads: "lido pelo site",
    next: ["site"],
  },
  {
    id: "site",
    label: "Rotas públicas",
    eyebrow: "Next.js",
    icon: Eye,
    status: "publico",
    summary: "Painéis, relatórios e mapas cidadãos publicados no site.",
    detail:
      "A interface traduz os dados publicados em linguagem acessível, sem tratar ausência como zero e sem ler camadas internas.",
    next: [],
  },
]

const PUBLIC_AREAS = [
  "saude",
  "educacao",
  "receita",
  "despesa",
  "fornecedores",
  "restos",
  "seguranca",
  "transporte",
  "camara",
  "emendas",
  "contratos",
  "transferencias",
  "autarquias",
  "fiscal",
  "controle externo",
]

export default function FluxoPage() {
  const [activeId, setActiveId] = useState("public")
  const activeNode = FLOW_NODES.find((node) => node.id === activeId) ?? FLOW_NODES[4]
  const ActiveIcon = activeNode.icon

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-01)]">
      <ShellHeader />
      <main className="flex-1">
        <section className="border-b border-[var(--border-01)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-03)]">
                  Fluxo de publicação
                </p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  Do portal oficial ao painel cidadão
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-03)]">
                  Este mapa mostra a regra central da ONG: o site só lê `data/public`.
                  Camadas internas existem para auditoria, extração e QA, mas não são publicação.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded border border-[var(--border-01)] bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-02)]">
                <ShieldCheck size={16} className="text-[var(--support-success)]" />
                Gate de publicação preservado
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded border border-[var(--border-01)] bg-[var(--bg-elevated)]">
            <div className="grid grid-cols-1 border-b border-[var(--border-01)] md:grid-cols-6">
              {FLOW_NODES.map((node, index) => {
                const Icon = node.icon
                const isActive = activeId === node.id
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActiveId(node.id)}
                    className={`min-h-[152px] border-b border-[var(--border-01)] p-4 text-left transition md:border-b-0 md:border-r ${
                      isActive
                        ? "bg-[var(--bg-raised)] text-[var(--text-01)]"
                        : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                    }`}
                    style={{ borderRightColor: "var(--border-01)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-2">
                        <Icon size={18} />
                      </span>
                      <span className="text-[10px] uppercase text-[var(--text-04)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
                      {node.eyebrow}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold">{node.label}</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-03)]">{node.summary}</p>
                  </button>
                )
              })}
            </div>

            <div className="relative min-h-[380px] p-5 md:p-8">
              <div className="absolute inset-0 opacity-[0.08] fluxo-grid" />
              <div className="relative grid grid-cols-1 gap-4 md:grid-cols-6">
                {FLOW_NODES.map((node, index) => {
                  const Icon = node.icon
                  const isActive = activeId === node.id
                  return (
                    <div key={node.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveId(node.id)}
                        className={`relative z-10 flex h-28 w-full flex-col justify-between rounded border p-3 text-left transition ${
                          isActive
                            ? "border-[var(--theme-accent)] bg-[var(--bg-raised)] shadow-lg"
                            : "border-[var(--border-01)] bg-[var(--bg-base)] hover:border-[var(--border-02)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon size={16} />
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                              node.status === "publico"
                                ? "bg-[rgba(34,197,94,0.12)] text-[var(--support-success)]"
                                : node.status === "gate"
                                  ? "bg-[rgba(234,179,8,0.12)] text-[var(--support-warning)]"
                                  : "bg-[rgba(148,163,184,0.12)] text-[var(--text-03)]"
                            }`}
                          >
                            {STATUS_LABEL[node.status]}
                          </span>
                        </div>
                        <span className="text-xs font-semibold">{node.label}</span>
                      </button>
                      {index < FLOW_NODES.length - 1 && (
                        <div className="hidden md:block absolute left-[calc(100%-2px)] top-1/2 z-0 w-4 -translate-y-1/2 text-[var(--text-04)]">
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="relative mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-4">
                  <Lock size={16} className="mb-3 text-[var(--support-warning)]" />
                  <h3 className="text-sm font-semibold">Camadas internas não são site</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-03)]">
                    As camadas internas ajudam a auditar e preparar publicação,
                    mas não devem ser tratados como base pública.
                  </p>
                </div>
                <div className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-4">
                  <FileCheck2 size={16} className="mb-3 text-[var(--theme-accent)]" />
                  <h3 className="text-sm font-semibold">Manifesto dá lastro</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-03)]">
                    `data/manifests` documenta fonte, status, scripts e limitações para que a
                    publicação seja auditável.
                  </p>
                </div>
                <div className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-4">
                  <Eye size={16} className="mb-3 text-[var(--support-success)]" />
                  <h3 className="text-sm font-semibold">Interface traduz, não inventa</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-03)]">
                    Dado ausente continua ausente. O site mostra cobertura, limites e próximos passos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded border border-[var(--border-01)] bg-[var(--bg-elevated)] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
              Nó selecionado
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] p-3">
                <ActiveIcon size={22} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{activeNode.label}</h2>
                <p className="text-xs text-[var(--text-04)]">{activeNode.eyebrow}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-[var(--text-02)]">{activeNode.detail}</p>
            {activeNode.reads && (
              <div className="mt-5 rounded border border-[var(--support-success)] bg-[rgba(34,197,94,0.08)] p-3 text-xs text-[var(--support-success)]">
                {activeNode.reads}
              </div>
            )}
            <div className="mt-6 border-t border-[var(--border-01)] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-04)]">
                Áreas publicadas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PUBLIC_AREAS.map((area) => (
                  <span
                    key={area}
                    className="rounded border border-[var(--border-01)] bg-[var(--bg-base)] px-2 py-1 text-[11px] text-[var(--text-02)]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <PageFooter />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .fluxo-grid {
              background-image:
                linear-gradient(var(--border-01) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-01) 1px, transparent 1px);
              background-size: 28px 28px;
            }
          `,
        }}
      />
    </div>
  )
}
