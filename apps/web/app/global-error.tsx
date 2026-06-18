"use client"

import Link from "next/link"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          backgroundColor: "#161616",
          color: "#f4f4f4",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
          padding: "32px",
          margin: 0,
        }}
      >
        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: "#ff8389",
            fontWeight: 700,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Erro crítico
        </p>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 300,
            textAlign: "center",
            margin: 0,
          }}
        >
          Anatomia do Gasto encontrou um problema
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#c6c6c6",
            textAlign: "center",
            maxWidth: "440px",
            margin: 0,
          }}
        >
          Um erro inesperado impediu a aplicação de carregar.
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <Link
            href="/"
            style={{
              padding: "8px 24px",
              border: "1px solid #525252",
              color: "#f4f4f4",
              textDecoration: "none",
              fontSize: "14px",
              borderRadius: "2px",
            }}
          >
            Voltar para o início
          </Link>
          <button
            onClick={reset}
            style={{
              padding: "8px 24px",
              backgroundColor: "#0f62fe",
              color: "#ffffff",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              borderRadius: "2px",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
