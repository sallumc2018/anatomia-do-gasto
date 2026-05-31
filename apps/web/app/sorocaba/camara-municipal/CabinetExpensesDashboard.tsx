"use client"

import React, { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"

export interface CabinetExpenseRow {
  ano: number
  mes: number
  vereador: string
  aluguel_maquina: number
  combustivel: number
  material_escritorio: number
  postagem: number
  total: number
  reembolso: number
}

interface Props {
  expensesByYear: Record<number, CabinetExpenseRow[]>
  availableYears: number[]
}

export function CabinetExpensesDashboard({ expensesByYear, availableYears }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears.includes(2025) ? 2025 : availableYears[0] ?? 2024
  )
  const [expenseFilter, setExpenseFilter] = useState<"total" | "combustivel" | "aluguel_maquina" | "material_escritorio">("total")

  const yearData = useMemo(() => {
    const raw = expensesByYear[selectedYear] ?? []
    // Group and aggregate by vereador
    const map: Record<string, {
      vereador: string
      aluguel_maquina: number
      combustivel: number
      material_escritorio: number
      postagem: number
      total: number
    }> = {}

    for (const r of raw) {
      const name = r.vereador
      if (!map[name]) {
        map[name] = {
          vereador: name,
          aluguel_maquina: 0,
          combustivel: 0,
          material_escritorio: 0,
          postagem: 0,
          total: 0
        }
      }
      map[name].aluguel_maquina += r.aluguel_maquina
      map[name].combustivel += r.combustivel
      map[name].material_escritorio += r.material_escritorio
      map[name].postagem += r.postagem
      map[name].total += r.total
    }

    return Object.values(map).sort((a, b) => b[expenseFilter] - a[expenseFilter])
  }, [selectedYear, expensesByYear, expenseFilter])

  const totalYearExpenditure = useMemo(() => {
    return yearData.reduce((s, r) => s + r.total, 0)
  }, [yearData])

  const averagePerCabinet = useMemo(() => {
    if (yearData.length === 0) return 0
    return totalYearExpenditure / yearData.length
  }, [yearData, totalYearExpenditure])

  const chartData = useMemo(() => {
    return yearData.slice(0, 15).map(r => ({
      name: r.vereador.split(" ").slice(0, 2).join(" "), // shorter name for X-axis
      fullName: r.vereador,
      valor: r[expenseFilter]
    }))
  }, [yearData, expenseFilter])

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-01)]">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold mb-1">Exercício</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded border border-[var(--border-02)] bg-[var(--bg-base)] text-[var(--text-01)] text-sm font-semibold"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold mb-1">Métrica do Gráfico</label>
            <div className="flex rounded border border-[var(--border-02)] overflow-hidden text-sm">
              {[
                { key: "total", label: "Cota Total" },
                { key: "combustivel", label: "Combustível" },
                { key: "aluguel_maquina", label: "Aluguel de Máquinas" },
                { key: "material_escritorio", label: "Escritório" },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setExpenseFilter(btn.key as "total" | "combustivel" | "aluguel_maquina" | "material_escritorio")}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    expenseFilter === btn.key 
                      ? "bg-[var(--theme-accent)] text-white" 
                      : "bg-[var(--bg-base)] text-[var(--text-02)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold">Total Acumulado no Ano</p>
          <p className="text-xl font-mono font-bold text-[var(--text-01)]">{formatBRL(totalYearExpenditure)}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded bg-[var(--bg-elevated)] border border-[var(--border-01)]">
          <p className="text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold">Média Anual por Gabinete</p>
          <p className="text-lg font-mono font-bold text-[var(--text-01)] mt-2">{formatBRL(averagePerCabinet)}</p>
        </div>
        <div className="p-4 rounded bg-[var(--bg-elevated)] border border-[var(--border-01)]">
          <p className="text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold">Gabinete Líder de Gastos</p>
          <p className="text-md font-bold text-[var(--text-01)] mt-2 truncate" title={yearData[0]?.vereador}>
            {yearData[0]?.vereador ?? "—"}
          </p>
          <p className="text-xs text-[var(--text-03)] font-mono">{yearData[0] ? formatBRL(yearData[0].total) : ""}</p>
        </div>
        <div className="p-4 rounded bg-[var(--bg-elevated)] border border-[var(--border-01)]">
          <p className="text-xs uppercase tracking-wider text-[var(--text-03)] font-semibold">Gabinete mais Econômico</p>
          <p className="text-md font-bold text-[var(--text-01)] mt-2 truncate" title={yearData[yearData.length - 1]?.vereador}>
            {yearData[yearData.length - 1]?.vereador ?? "—"}
          </p>
          <p className="text-xs text-[var(--text-03)] font-mono">
            {yearData[yearData.length - 1] ? formatBRL(yearData[yearData.length - 1].total) : ""}
          </p>
        </div>
      </div>

      {/* Ranking Chart */}
      <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-01)]">
          Ranking dos 15 Gabinetes que Mais Consumiram a Cota ({selectedYear})
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--text-04)] text-center py-12">Nenhum dado contábil disponível para este exercício.</p>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} stroke="var(--border-01)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-03)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border-01)" }}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  tickFormatter={(v) => `R$ ${(v / 1e3).toFixed(0)}k`}
                  tick={{ fill: "var(--text-04)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number" ? formatBRL(value) : String(value),
                    "Gasto Acumulado"
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-01)",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                    color: "var(--text-01)"
                  }}
                  labelFormatter={(label, items) => items[0]?.payload?.fullName ?? label}
                />
                <Bar dataKey="valor" fill="var(--theme-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grid of All Cabinets */}
      <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[var(--text-01)]">
          Detalhamento de Gastos por Gabinete ({selectedYear})
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-left border-collapse min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border-01)]">
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs">Vereador</th>
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs text-right">Reprografia</th>
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs text-right">Combustível</th>
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs text-right">Mat. Escritório</th>
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs text-right">Postagem</th>
                <th className="py-2 text-[var(--text-04)] font-semibold uppercase text-xs text-right">Cota Total</th>
              </tr>
            </thead>
            <tbody>
              {yearData.map((r, idx) => (
                <tr key={r.vereador} className="border-b border-[var(--border-01)] hover:bg-[var(--bg-base)]/50">
                  <td className="py-3 font-semibold text-[var(--text-01)]">
                    <span className="text-[var(--text-03)] font-normal text-xs mr-2">{idx + 1}</span>
                    {r.vereador}
                  </td>
                  <td className="py-3 text-right font-mono text-[var(--text-02)]">{formatBRL(r.aluguel_maquina)}</td>
                  <td className="py-3 text-right font-mono text-[var(--text-02)]">{formatBRL(r.combustivel)}</td>
                  <td className="py-3 text-right font-mono text-[var(--text-02)]">{formatBRL(r.material_escritorio)}</td>
                  <td className="py-3 text-right font-mono text-[var(--text-02)]">{formatBRL(r.postagem)}</td>
                  <td className="py-3 text-right font-mono font-bold text-[var(--text-01)]">{formatBRL(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
