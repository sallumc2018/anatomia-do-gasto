"use client"

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts"

export interface DonutPoint {
  nome: string
  valor: number
  color: string
}

interface Props {
  data: DonutPoint[]
}

function fmtTooltip(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toFixed(2)} bi`
  return `R$ ${(v / 1e6).toFixed(0)} mi`
}

export function DonutFuncoes({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="valor"
          nameKey="nome"
          cx="50%"
          cy="42%"
          innerRadius={64}
          outerRadius={108}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [
            typeof value === "number" ? fmtTooltip(value) : String(value),
          ]}
          contentStyle={{
            backgroundColor: "#262626",
            border: "1px solid #393939",
            borderRadius: 0,
            fontSize: "12px",
            fontFamily: "IBM Plex Mono, monospace",
            color: "#f4f4f4",
            padding: "8px 12px",
          }}
          itemStyle={{ color: "#c6c6c6" }}
          labelStyle={{ color: "#f4f4f4", marginBottom: "4px", fontWeight: 600 }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{
            fontSize: "11px",
            color: "#a8a8a8",
            fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: "0.04em",
            lineHeight: "20px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
