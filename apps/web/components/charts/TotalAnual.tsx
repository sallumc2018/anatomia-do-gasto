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
        <CartesianGrid vertical={false} stroke="#393939" />
        <XAxis
          dataKey="year"
          tick={{ fill: "#a8a8a8", fontSize: 13, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={{ stroke: "#393939" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtM}
          tick={{ fill: "#8d8d8d", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
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
          cursor={{ stroke: "#525252", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#78a9ff"
          strokeWidth={2}
          dot={<Dot r={4} fill="#78a9ff" stroke="#161616" strokeWidth={2} />}
          activeDot={{ r: 5, fill: "#78a9ff", stroke: "#161616", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
