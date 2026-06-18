"use client"

import { useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell
} from "recharts"

interface Subvencao {
  fornecedor_nome: string
  ano: number
  total_empenhos: number
  valor_total: number // in cents from raw CSV
}

interface InboundTransfer {
  year: number
  federal: number
  estadual: number
  total: number
}

interface TransferChartsProps {
  subvencoes: Subvencao[]
  inboundTransfers: InboundTransfer[]
  availableYears: number[]
}

const COLORS = [
  "var(--theme-accent, #ec4899)", // vibrant pink/magenta
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#a855f7"  // purple
]

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value)
}

function truncateName(name: string, maxLen = 30): string {
  if (!name) return "ORGANIZAÇÃO NÃO IDENTIFICADA"
  const clean = name.replace(/^(IRMANDADE|ASSOCIACAO|CENTRO|INSTITUTO|FUNDACAO)\s+/i, "")
  if (clean.length <= maxLen) return clean
  return clean.slice(0, maxLen) + "..."
}

export function TransferCharts({ subvencoes, inboundTransfers, availableYears }: TransferChartsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || 2025)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"osc" | "federativo">("osc")

  // Filter subventions by year
  const yearSubvencoes = useMemo(() => {
    return subvencoes
      .filter((s) => s.ano === selectedYear && s.fornecedor_nome)
      .map((s) => ({
        ...s,
        // Convert from cents to Reais
        valor_real: s.valor_total / 100
      }))
      .sort((a, b) => b.valor_real - a.valor_real)
  }, [subvencoes, selectedYear])

  // Get Top 10 for charts
  const top10OSCs = useMemo(() => {
    return yearSubvencoes.slice(0, 10).map((s) => ({
      ...s,
      displayName: truncateName(s.fornecedor_nome, 25)
    }))
  }, [yearSubvencoes])

  // Aggregate stats for KPI cards
  const kpis = useMemo(() => {
    const totalOsc = yearSubvencoes.reduce((acc, curr) => acc + curr.valor_real, 0)
    const countOsc = yearSubvencoes.length
    
    const inbound = inboundTransfers.find((t) => t.year === selectedYear) || { federal: 0, estadual: 0, total: 0 }
    
    return {
      totalOsc,
      countOsc,
      federal: inbound.federal,
      estadual: inbound.estadual,
      totalTransfers: inbound.total
    }
  }, [yearSubvencoes, inboundTransfers, selectedYear])

  // Filter list by search query
  const filteredSubvencoes = useMemo(() => {
    if (!searchQuery.trim()) return yearSubvencoes
    const q = searchQuery.toLowerCase()
    return yearSubvencoes.filter((s) => s.fornecedor_nome.toLowerCase().includes(q))
  }, [yearSubvencoes, searchQuery])

  return (
    <div className="space-y-8">
      {/* Controls & Tab selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("osc")}
            className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
              activeTab === "osc"
                ? "bg-[var(--theme-accent)] text-white"
                : "text-[var(--text-02)] hover:text-[var(--text-01)] hover:bg-[var(--border-01)]"
            }`}
          >
            Terceiro Setor (OSCs)
          </button>
          <button
            onClick={() => setActiveTab("federativo")}
            className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
              activeTab === "federativo"
                ? "bg-[var(--theme-accent)] text-white"
                : "text-[var(--text-02)] hover:text-[var(--text-01)] hover:bg-[var(--border-01)]"
            }`}
          >
            Pacto Federativo (Inbound)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-semibold text-[var(--text-03)]">Filtrar Ano:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded border border-[var(--border-01)] bg-[var(--bg-base)] text-[var(--text-01)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] relative overflow-hidden">
          <p className="text-xs uppercase font-semibold tracking-wider text-[var(--text-03)] mb-1">Repasses OSCs</p>
          <p className="text-2xl font-mono font-bold text-[var(--text-01)]">{formatBRL(kpis.totalOsc)}</p>
          <p className="text-xs text-[var(--text-04)] mt-2">
            Repassados para {kpis.countOsc} entidades da sociedade civil
          </p>
          <div className="absolute right-2 bottom-2 opacity-5 text-[var(--text-01)]">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] relative overflow-hidden">
          <p className="text-xs uppercase font-semibold tracking-wider text-[var(--text-03)] mb-1">Inbound Estadual</p>
          <p className="text-2xl font-mono font-bold text-sky-400">{formatBRL(kpis.estadual)}</p>
          <p className="text-xs text-[var(--text-04)] mt-2">Transferências correntes do Estado</p>
          <div className="absolute right-2 bottom-2 opacity-5 text-sky-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] relative overflow-hidden">
          <p className="text-xs uppercase font-semibold tracking-wider text-[var(--text-03)] mb-1">Inbound Federal (Convênios)</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">{formatBRL(kpis.federal)}</p>
          <p className="text-xs text-[var(--text-04)] mt-2">Repasses federais vinculados a convênios</p>
          <div className="absolute right-2 bottom-2 opacity-5 text-emerald-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.284 16.284A3 3 0 006.182 17.2m11.636-1.016a3.001 3.001 0 002.102.916m-7.564-3.153a3 3 0 00-2.109-.345m7.148.345a3 3 0 012.109-.345m0 0a3 3 0 005.291-2.228 3 3 0 00-5.291-2.228m-7.564 3.153a3 3 0 00-2.109-.345m0 0a3 3 0 00-5.291 2.228 3 3 0 005.291 2.228m0 0a3 3 0 002.109-.345M12 12a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] relative overflow-hidden">
          <p className="text-xs uppercase font-semibold tracking-wider text-[var(--text-03)] mb-1">Total Receitas de Parceria</p>
          <p className="text-2xl font-mono font-bold text-amber-500">{formatBRL(kpis.totalTransfers + kpis.totalOsc)}</p>
          <p className="text-xs text-[var(--text-04)] mt-2">Inbound externo + repasses sociais</p>
          <div className="absolute right-2 bottom-2 opacity-5 text-amber-500">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Panels */}
      {activeTab === "osc" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Top 10 OSCs Chart */}
          <div className="lg:col-span-7 p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--text-01)]">
              Maiores Repasses ao Terceiro Setor em {selectedYear}
            </h3>
            <p className="text-xs text-[var(--text-03)] mb-6">
              Ranking dos 10 maiores destinatários de subvenções e termos de parceria.
            </p>
            
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10OSCs}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-01)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="var(--text-04)"
                    tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                    fontSize={11}
                  />
                  <YAxis
                    dataKey="displayName"
                    type="category"
                    stroke="var(--text-03)"
                    width={150}
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const val = typeof value === "number" ? value : parseFloat(String(value || 0))
                      return [formatBRL(val), "Valor Repassado"]
                    }}
                    labelFormatter={(label, items) => {
                      const item = items[0]?.payload as Subvencao;
                      return item ? item.fornecedor_nome : String(label);
                    }}
                    contentStyle={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-01)",
                      color: "var(--text-01)",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="valor_real" radius={[0, 4, 4, 0]}>
                    {top10OSCs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Third Sector context panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-01)]">
                Papel Estrutural do Terceiro Setor
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-02)] space-y-3">
                Sorocaba terceiriza parcelas significativas de sua rede de saúde e assistência social para 
                Organizações da Sociedade Civil (OSCs) — também conhecidas como ONGs.
                <br /><br />
                A **Irmandade da Santa Casa de Misericórdia** e o **GPACI (Grupo de Pesquisa e Assistência ao Câncer Infantil)**
                são parceiras essenciais, gerindo leitos, cirurgias e serviços de urgência sob convênio municipal, 
                representando os maiores fluxos de repasse de subvenção do caixa da prefeitura.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)] border-l-4 border-l-amber-500 bg-amber-500/5">
              <h4 className="text-xs uppercase font-bold text-amber-500 mb-2">Transparência Ativa</h4>
              <p className="text-xs leading-relaxed text-[var(--text-02)]">
                A Lei Federal 13.019/2014 (MROSC) exige que todo repasse municipal para organizações civis seja precedido de chamamento público e documentado. 
                Os valores agregados acima consolidam empenhos liquidados com naturezas de despesa de transferência (3.3.50).
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Inbound Transfers Chart */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--text-01)]">
              Evolução das Receitas Externas de Sorocaba (2020–2025)
            </h3>
            <p className="text-xs text-[var(--text-03)] mb-6">
              Trajetória de recursos captados junto ao Estado (RREO) e União (Convênios Federais).
            </p>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={inboundTransfers}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-01)" />
                  <XAxis dataKey="year" stroke="var(--text-04)" fontSize={11} />
                  <YAxis
                    stroke="var(--text-04)"
                    fontSize={11}
                    tickFormatter={(v) => `R$ ${(v / 1e6).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const val = typeof value === "number" ? value : parseFloat(String(value || 0))
                      return [formatBRL(val), ""]
                    }}
                    contentStyle={{
                      backgroundColor: "var(--bg-base)",
                      borderColor: "var(--border-01)",
                      color: "var(--text-01)",
                      borderRadius: "6px"
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    name="Estadual (RREO Rec. Correntes)"
                    type="monotone"
                    dataKey="estadual"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    name="Federal (Convênios Firmados)"
                    type="monotone"
                    dataKey="federal"
                    stroke="#34d399"
                    strokeWidth={3}
                  />
                  <Line
                    name="Total Receitas Externas"
                    type="monotone"
                    dataKey="total"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-01)]">
                O Pacto Federativo
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-02)]">
                A capacidade de investimento de Sorocaba é intensamente condicionada a transferências constitucionais e voluntárias. 
                <br /><br />
                As transferências estaduais, como a cota-parte do ICMS e IPVA, compõem a maior fatia de sustentabilidade orçamentária do município, superando significativamente os convênios federais discricionários em volume.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-03)]">
                Comparativo Rápido (2025)
              </h3>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs py-1 border-b border-[var(--border-01)]">
                  <span className="text-[var(--text-02)]">Repasse Estadual</span>
                  <span className="font-mono font-bold text-sky-400">{formatBRL(kpis.estadual)}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-[var(--border-01)]">
                  <span className="text-[var(--text-02)]">Repasse Federal</span>
                  <span className="font-mono font-bold text-emerald-400">{formatBRL(kpis.federal)}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-[var(--text-02)]">Proporção Estadual</span>
                  <span className="font-mono font-bold text-amber-500">
                    {kpis.totalTransfers > 0 ? ((kpis.estadual / kpis.totalTransfers) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Searchable Data Table */}
      {activeTab === "osc" && (
        <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-01)]">
                Detalhamento dos Repasses Sociais — {selectedYear}
              </h3>
              <p className="text-xs text-[var(--text-03)] mt-1">
                Use a busca abaixo para auditar os empenhos acumulados por entidade.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar entidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded border border-[var(--border-01)] bg-[var(--bg-base)] text-xs text-[var(--text-01)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)]"
              />
              <div className="absolute left-2.5 top-2.5 text-[var(--text-04)]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--border-01)]">
                  <th className="text-left font-semibold uppercase tracking-wider text-[var(--text-04)] text-[10px] pb-3 pt-1 px-3">
                    Razão Social da Entidade (OSC)
                  </th>
                  <th className="text-center font-semibold uppercase tracking-wider text-[var(--text-04)] text-[10px] pb-3 pt-1 px-3 w-32">
                    Empenhos
                  </th>
                  <th className="text-right font-semibold uppercase tracking-wider text-[var(--text-04)] text-[10px] pb-3 pt-1 px-3 w-48">
                    Valor Consolidado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubvencoes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-xs text-[var(--text-04)]">
                      Nenhuma entidade localizada para os termos informados.
                    </td>
                  </tr>
                ) : (
                  filteredSubvencoes.slice(0, 15).map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border-01)] hover:bg-[var(--bg-base)]/50 transition-colors">
                      <td className="py-3 px-3 text-xs font-semibold text-[var(--text-01)]">
                        {row.fornecedor_nome}
                      </td>
                      <td className="py-3 px-3 text-xs font-mono text-center text-[var(--text-02)]">
                        {row.total_empenhos}
                      </td>
                      <td className="py-3 px-3 text-xs font-mono text-right font-bold text-[var(--text-01)]">
                        {formatBRL(row.valor_real)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredSubvencoes.length > 15 && (
            <p className="text-[11px] text-[var(--text-04)] mt-4 text-center">
              Mostrando os 15 maiores resultados de {filteredSubvencoes.length} registros totais. 
              Refine a busca para encontrar registros específicos.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
