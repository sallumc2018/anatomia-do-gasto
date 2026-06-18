"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts"

export interface PctRclPoint {
  ano: string
  valor: number
}

interface Props {
  data: PctRclPoint[]
  limite: number
  limiteLabel: string
  limitePrudencial?: number
  barColor?: string
}

function CustomTooltip({ active, payload, label, limite }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active?: boolean; payload?: ReadonlyArray<any>; label?: string | number; limite: number
}) {
  if (!active || !payload?.length) return null
  const v = Number(payload[0]?.value ?? 0)
  const margem = limite - v
  return (
    <div style={{
      backgroundColor: "#1e1e1e",
      border: "1px solid #393939",
      padding: "10px 14px",
      fontSize: "13px",
    }}>
      <p style={{ color: "#f4f4f4", fontWeight: 600, marginBottom: "4px" }}>{String(label ?? "")}</p>
      <p style={{ color: "#78a9ff" }}>{v.toFixed(2)}% da RCL</p>
      <p style={{ color: "#6f6f6f", fontSize: "11px" }}>
        margem p/ limite: {margem.toFixed(2)} pp
      </p>
    </div>
  )
}

export function PctRclChart({ data, limite, limiteLabel, limitePrudencial, barColor = "#4589ff" }: Props) {
  const maxVal = Math.max(...data.map((d) => d.valor), limite * 0.6)
  const yMax   = Math.min(Math.ceil((maxVal * 1.1) / 10) * 10, 120)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barSize={20} barCategoryGap="35%"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#393939" vertical={false} />
        <XAxis
          dataKey="ano"
          tick={{ fill: "#6f6f6f", fontSize: 11 }}
          axisLine={{ stroke: "#393939" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, yMax]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fill: "#6f6f6f", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} limite={limite} />} />

        {limitePrudencial && (
          <ReferenceLine
            y={limitePrudencial}
            stroke="#f1c21b"
            strokeDasharray="4 3"
            label={{ value: `Prudencial ${limitePrudencial}%`, fill: "#f1c21b", fontSize: 10, position: "insideTopRight" }}
          />
        )}

        <ReferenceLine
          y={limite}
          stroke="#da1e28"
          strokeDasharray="4 3"
          label={{ value: limiteLabel, fill: "#da1e28", fontSize: 10, position: "insideTopRight" }}
        />

        <Bar dataKey="valor" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.ano}
              fill={entry.valor > limitePrudencial! ? "#f1c21b" : barColor}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
