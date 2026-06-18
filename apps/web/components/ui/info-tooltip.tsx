"use client"

import { useState, useRef } from "react"

interface InfoTooltipProps {
  text: string
  href?: string
}

export function InfoTooltip({ text, href }: InfoTooltipProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!text) return null

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (!triggerRef.current) return
    const r       = triggerRef.current.getBoundingClientRect()
    const w       = 240
    const rawLeft = r.left + r.width / 2
    const left    = Math.max(w / 2 + 8, Math.min(window.innerWidth - w / 2 - 8, rawLeft))
    setPos({ top: r.top - 8, left })
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setPos(null), 150)
  }

  function cancelHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        style={{ display: "inline-flex", alignItems: "center", marginLeft: "5px", verticalAlign: "middle" }}
      >
        <span
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            justifyContent: "center",
            width:          "14px",
            height:         "14px",
            borderRadius:   "50%",
            border:         "1px solid var(--text-04)",
            fontSize:       "9px",
            color:          "var(--text-04)",
            cursor:         "help",
            lineHeight:     "1",
            fontFamily:     "var(--font-ibm-plex-mono)",
            flexShrink:     0,
          }}
        >
          ?
        </span>
      </span>

      {pos && (
        <div
          role="tooltip"
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
          style={{
            position:        "fixed",
            top:             pos.top,
            left:            pos.left,
            transform:       "translate(-50%, -100%)",
            width:           "240px",
            backgroundColor: "var(--bg-elevated)",
            border:          "1px solid var(--border-02)",
            padding:         "10px 12px",
            zIndex:          1000,
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--text-02)", lineHeight: "1.6", margin: 0 }}>
            {text}
          </p>
          {href && (
            <a
              href={href}
              style={{
                display:        "block",
                marginTop:      "8px",
                fontSize:       "11px",
                color:          "var(--blue-60)",
                textDecoration: "none",
              }}
            >
              Ver definição completa →
            </a>
          )}
        </div>
      )}
    </>
  )
}
