"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export interface ComparativoPoint {
  funcao: string
  [year: string]: number | string
}

interface Props {
  data: ComparativoPoint[]
  years: number[]
}

// Most recent year = blue-40; older years get progressively darker grays
const COLOR_SEQ = ["#0f62fe", "#4589ff", "#78a9ff"]

function fmtMillions(v: number): string {
  return `${(v / 1e6).toFixed(0)}M`
}

export function ComparativoAnos({ data, years }: Props) {
  const colors = COLOR_SEQ.slice(COLOR_SEQ.length - years.length)

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={data}
        layout="vertical"
        barCategoryGap="28%"
        barGap={2}
        margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="#393939" />
        <XAxis
          type="number"
          tickFormatter={fmtMillions}
          tick={{ fill: "#8d8d8d", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="funcao"
          width={148}
          tick={{ fill: "#a8a8a8", fontSize: 12, fontFamily: "IBM Plex Sans, sans-serif" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `R$ ${(value / 1e6).toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} M`,
            name,
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
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "11px",
            color: "#a8a8a8",
            fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: "0.04em",
            paddingTop: "12px",
          }}
        />
        {years.map((year, i) => (
          <Bar
            key={year}
            dataKey={String(year)}
            name={String(year)}
            fill={colors[i] ?? "#525252"}
            radius={0}
            barSize={9}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
