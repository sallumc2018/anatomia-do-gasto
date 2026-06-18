"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"

export interface SerieHistoricaPoint {
  ano: string
  fixado: number
  liquidado: number
}

interface Props {
  data: SerieHistoricaPoint[]
  unit?: "bi" | "mi"
}

function fmtBi(v: number) { return `${(v / 1e9).toFixed(1)}B` }
function fmtMi(v: number) { return `${(v / 1e6).toFixed(0)}M` }

const TOOLTIP_STYLE = {
  backgroundColor: "#262626",
  border: "1px solid #393939",
  borderRadius: 0,
  fontSize: "12px",
  fontFamily: "IBM Plex Mono, monospace",
  color: "#f4f4f4",
  padding: "8px 12px",
}

export function SerieHistorica({ data, unit = "bi" }: Props) {
  const fmt   = unit === "bi" ? fmtBi : fmtMi
  const div   = unit === "bi" ? 1e9   : 1e6
  const suffix = unit === "bi" ? "bi"  : "mi"

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        barCategoryGap="32%"
        barGap={3}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="#393939" />
        <XAxis
          dataKey="ano"
          tick={{ fill: "#a8a8a8", fontSize: 13, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={{ stroke: "#393939" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fill: "#8d8d8d", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number"
              ? `R$ ${(value / div).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ${suffix}`
              : String(value),
            name,
          ]}
          contentStyle={TOOLTIP_STYLE}
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
        <Bar dataKey="fixado"    name="Fixado (LOA)" fill="#393939" radius={0} barSize={11} />
        <Bar dataKey="liquidado" name="Liquidado"     fill="#4589ff" radius={0} barSize={11} />
      </BarChart>
    </ResponsiveContainer>
  )
}
