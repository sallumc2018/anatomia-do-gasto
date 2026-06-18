"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from "recharts"

export interface DcaDataPoint {
  year: number
  ativo: number
  passivo: number
  saldoPatrimonial: number
}

interface Props {
  data: DcaDataPoint[]
}

function fmtBillions(v: number) {
  const isNeg = v < 0
  const absVal = Math.abs(v)
  return `${isNeg ? "-" : ""}R$ ${(absVal / 1e9).toFixed(1)}B`
}

export function DcaCharts({ data }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {/* Saldo Patrimonial Chart */}
      <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--text-01)]">
          Evolução do Saldo Patrimonial Líquido (R$ Bilhões)
        </h3>
        <p className="text-xs text-[var(--text-03)] mb-6">
          O Saldo Patrimonial representa a diferença entre os bens/direitos (Ativo) e as obrigações (Passivo).
          A queda drástica indica aumento vertiginoso de dívidas e compromissos atuariais.
        </p>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border-01)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "var(--text-03)", fontSize: 13 }}
                axisLine={{ stroke: "var(--border-01)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtBillions}
                tick={{ fill: "var(--text-04)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                formatter={(value) => [
                  typeof value === "number"
                    ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : String(value),
                  "Saldo Patrimonial",
                ]}
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-01)",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                  color: "var(--text-01)",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: "var(--text-02)" }}
                labelStyle={{ color: "var(--text-01)", marginBottom: "4px", fontWeight: 600 }}
                cursor={{ fill: "var(--bg-high)", opacity: 0.1 }}
              />
              <ReferenceLine y={0} stroke="var(--border-02)" />
              <Bar dataKey="saldoPatrimonial" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.saldoPatrimonial < 0 ? "#ef4444" : "#22c55e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ativo vs Passivo Chart */}
      <div className="p-6 rounded-lg border border-[var(--border-01)] bg-[var(--bg-elevated)]">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-2 text-[var(--text-01)]">
          Ativo vs. Passivo e Patrimônio Líquido (R$ Bilhões)
        </h3>
        <p className="text-xs text-[var(--text-03)] mb-6">
          Comparação entre os recursos controlados pela prefeitura (Ativo) e as obrigações mais o saldo patrimonial.
        </p>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border-01)" />
              <XAxis
                dataKey="year"
                tick={{ fill: "var(--text-03)", fontSize: 13 }}
                axisLine={{ stroke: "var(--border-01)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtBillions}
                tick={{ fill: "var(--text-04)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === "number"
                    ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : String(value),
                  name === "ativo" ? "Ativo Total" : "Passivo + PL",
                ]}
                contentStyle={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-01)",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                  color: "var(--text-01)",
                  padding: "8px 12px",
                }}
                itemStyle={{ color: "var(--text-02)" }}
                labelStyle={{ color: "var(--text-01)", marginBottom: "4px", fontWeight: 600 }}
              />
              <Bar dataKey="ativo" fill="var(--theme-accent)" name="Ativo" radius={[4, 4, 0, 0]} />
              <Bar dataKey="passivo" fill="#3b82f6" name="Passivo + PL" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
