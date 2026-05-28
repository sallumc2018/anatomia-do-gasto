"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Dot,
} from "recharts"

export interface TotalAnualPoint {
  year: string
  total: number
}

interface Props {
  data: TotalAnualPoint[]
}

function fmtM(v: number) {
  return `${(v / 1e6).toFixed(0)}M`
}

export function TotalAnual({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border-01)" />
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--text-03)", fontSize: 13, fontFamily: "inherit" }}
          axisLine={{ stroke: "var(--border-01)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtM}
          tick={{ fill: "var(--text-04)", fontSize: 11, fontFamily: "inherit" }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value) => [
            typeof value === "number"
              ? `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M`
              : String(value),
            "Total liquidado",
          ]}
          contentStyle={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-01)",
            borderRadius: "var(--radius)",
            fontSize: "12px",
            fontFamily: "inherit",
            color: "var(--text-01)",
            padding: "8px 12px",
          }}
          itemStyle={{ color: "var(--text-02)" }}
          labelStyle={{ color: "var(--text-01)", marginBottom: "4px", fontWeight: 600 }}
          cursor={{ stroke: "var(--bg-high)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="var(--theme-accent)"
          strokeWidth={2}
          dot={<Dot r={4} fill="var(--theme-accent)" stroke="var(--bg-base)" strokeWidth={2} />}
          activeDot={{ r: 5, fill: "var(--theme-accent-hover)", stroke: "var(--bg-base)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
