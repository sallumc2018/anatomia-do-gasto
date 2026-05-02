"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"

export interface PorPeriodoPoint {
  year: string
  "1º quad": number
  "2º quad": number
  "3º quad": number
}

interface Props {
  data: PorPeriodoPoint[]
}

function fmtM(v: number) {
  return `${(v / 1e6).toFixed(0)}M`
}

export function PorPeriodo({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" barCategoryGap="35%" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#393939" />
        <XAxis
          type="number"
          tickFormatter={fmtM}
          tick={{ fill: "#8d8d8d", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="year"
          tick={{ fill: "#a8a8a8", fontSize: 13, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          formatter={(value, name) => [
            typeof value === "number"
              ? `R$ ${(value / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M`
              : String(value),
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
        <Bar dataKey="1º quad" name="1º quad — Jan–Abr" fill="#2d71e0" radius={0} barSize={9} />
        <Bar dataKey="2º quad" name="2º quad — Mai–Ago" fill="#5491f0" radius={0} barSize={9} />
        <Bar dataKey="3º quad" name="3º quad — Set–Dez" fill="#82aef5" radius={0} barSize={9} />
      </BarChart>
    </ResponsiveContainer>
  )
}
