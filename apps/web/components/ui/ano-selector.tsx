"use client"

import Link from "next/link"

interface Props {
  anos: number[]
  selectedAno: number
  basePath: string
}

export function AnoSelector({ anos, selectedAno, basePath }: Props) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {anos.map((ano) => {
        const active = ano === selectedAno
        return (
          <Link
            key={ano}
            href={`${basePath}?ano=${ano}`}
            style={{
              padding: "4px 14px",
              fontSize: "13px",
              fontFamily: "var(--font-ibm-plex-mono, monospace)",
              letterSpacing: "0.04em",
              border: `1px solid ${active ? "var(--blue-60)" : "var(--border-01)"}`,
              color: active ? "var(--blue-40)" : "var(--text-03)",
              backgroundColor: active ? "rgba(15,98,254,0.08)" : "transparent",
              textDecoration: "none",
              transition: "border-color 100ms, color 100ms",
            }}
          >
            {ano}
          </Link>
        )
      })}
    </div>
  )
}
