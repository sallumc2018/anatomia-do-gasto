"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { SEARCH_INDEX } from "@/lib/search-index"

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function SiteSearch() {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState("")
  const [focused, setFocused] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query.length >= 2
    ? SEARCH_INDEX.filter((e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase()) ||
        e.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 7)
    : []

  function openSearch() {
    setOpen(true)
    setQuery("")
    setFocused(0)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => { if (!v) { setQuery(""); setFocused(0) } return !v })
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  return (
    <>
      <button
        onClick={openSearch}
        aria-label="Buscar (Ctrl+K)"
        title="Buscar (Ctrl+K)"
        style={{
          background: "none",
          border: "1px solid var(--border-01)",
          cursor: "pointer",
          color: "var(--text-03)",
          padding: "5px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          fontFamily: "var(--font-ibm-plex-mono, monospace)",
          letterSpacing: "0.04em",
          transition: "border-color 100ms, color 100ms",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-02)"
          ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-02)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-01)"
          ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-03)"
        }}
      >
        <SearchIcon />
        <span className="hidden md:inline">Buscar</span>
        <span className="hidden lg:inline" style={{ fontSize: "10px", color: "var(--text-04)" }}>⌘K</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Busca no site"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "15vh",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              margin: "0 16px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-01)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            }}
          >
            {/* Input */}
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-01)" }}>
              <span style={{ color: "var(--text-04)", marginRight: "10px", flexShrink: 0 }}>
                <SearchIcon />
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setFocused(0) }}
                placeholder="Buscar páginas e seções…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "var(--text-01)",
                  fontSize: "15px",
                  fontFamily: "var(--font-ibm-plex-sans, sans-serif)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setFocused((v) => Math.min(v + 1, (results.length || SEARCH_INDEX.length) - 1)) }
                  if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((v) => Math.max(v - 1, 0)) }
                  if (e.key === "Enter") {
                    const list = results.length > 0 ? results : SEARCH_INDEX.slice(0, 7)
                    const entry = list[focused]
                    if (entry) { window.location.href = entry.href; setOpen(false) }
                  }
                }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-04)", padding: "2px 6px", marginLeft: "8px", fontSize: "11px", fontFamily: "monospace" }}
              >
                ESC
              </button>
            </div>

            {/* Resultados filtrados */}
            {results.length > 0 && (
              <div>
                {results.map((entry, i) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      padding: "11px 16px",
                      textDecoration: "none",
                      backgroundColor: i === focused ? "var(--bg-raised)" : "transparent",
                      borderBottom: i < results.length - 1 ? "1px solid var(--border-01)" : "none",
                      transition: "background-color 80ms",
                    }}
                    onMouseEnter={() => setFocused(i)}
                  >
                    <p style={{ fontSize: "14px", color: "var(--text-01)", fontWeight: 500, marginBottom: "2px" }}>{entry.title}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-03)", lineHeight: "18px" }}>{entry.description}</p>
                  </Link>
                ))}
              </div>
            )}

            {/* Sem resultados */}
            {query.length >= 2 && results.length === 0 && (
              <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-04)", fontSize: "14px" }}>
                Nenhum resultado para &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Estado inicial — todas as páginas */}
            {query.length < 2 && (
              <div>
                <p style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-04)", padding: "10px 16px 6px", fontWeight: 600 }}>
                  Páginas
                </p>
                {SEARCH_INDEX.slice(0, 7).map((entry, i) => (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      padding: "9px 16px",
                      textDecoration: "none",
                      backgroundColor: i === focused ? "var(--bg-raised)" : "transparent",
                      borderTop: "1px solid var(--border-01)",
                      transition: "background-color 80ms",
                    }}
                    onMouseEnter={() => setFocused(i)}
                  >
                    <p style={{ fontSize: "14px", color: "var(--text-02)" }}>{entry.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
