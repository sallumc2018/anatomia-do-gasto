"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "32px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          letterSpacing: "0.08em",
          color: "var(--support-error)",
          fontWeight: 700,
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        Erro
      </p>
      <h2
        style={{
          fontSize: "20px",
          color: "var(--text-01)",
          fontWeight: 300,
          textAlign: "center",
          margin: 0,
        }}
      >
        Algo deu errado ao carregar esta página
      </h2>
      <p
        style={{
          fontSize: "14px",
          lineHeight: "22px",
          color: "var(--text-02)",
          textAlign: "center",
          maxWidth: "480px",
          margin: 0,
        }}
      >
        Os dados não puderam ser carregados. O problema pode ser temporário.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "8px",
          padding: "8px 24px",
          backgroundColor: "var(--blue-60)",
          color: "var(--text-on-color)",
          border: "none",
          borderRadius: "var(--radius)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
