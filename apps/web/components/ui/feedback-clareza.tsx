"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"

/**
 * "Jóia" de compreensão: pergunta se o dado em linguagem cidadã ficou claro.
 * Envia apenas um voto anônimo (booleano) + o caminho da página para o Vercel Analytics.
 * NUNCA coleta texto digitado, IP ou identificador. Um voto por renderização.
 */
export function FeedbackClareza() {
  const pathname = usePathname()
  const [voted, setVoted] = useState<boolean | null>(null)

  function vote(util: boolean) {
    if (voted !== null) return
    setVoted(util)
    trackEvent.feedbackClareza(pathname, util)
  }

  if (voted !== null) {
    return (
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-03)",
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid var(--border-02)",
          fontFamily: "var(--font-ibm-plex-mono)",
        }}
      >
        {voted ? "Obrigado pelo retorno!" : "Obrigado — vamos trabalhar para deixar isto mais claro."}
      </p>
    )
  }

  const btn: React.CSSProperties = {
    cursor: "pointer",
    background: "transparent",
    border: "1px solid var(--border-02)",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "15px",
    lineHeight: 1,
    color: "var(--text-02)",
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "16px",
        paddingTop: "14px",
        borderTop: "1px solid var(--border-02)",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--text-03)" }}>Esse dado ficou claro?</span>
      <button type="button" onClick={() => vote(true)} aria-label="Sim, o dado ficou claro" style={btn}>
        👍
      </button>
      <button type="button" onClick={() => vote(false)} aria-label="Não, o dado não ficou claro" style={btn}>
        👎
      </button>
    </div>
  )
}
