"use client"

import { useEffect, useState } from "react"
import { Sparkles, Palette, Flame, ShieldAlert, Sun } from "lucide-react"

const THEMES = [
  { id: "carbon", name: "Carbon", icon: Sparkles, color: "#0f62fe" },
  { id: "emerald", name: "Emerald", icon: Palette, color: "#10b981" },
  { id: "royal", name: "Royal", icon: Flame, color: "#a855f7" },
  { id: "crimson", name: "Crimson", icon: ShieldAlert, color: "#e11d48" },
  { id: "light", name: "Light", icon: Sun, color: "#2563eb" },
]

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState("carbon")

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme") || "carbon"
      setActiveTheme(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const changeTheme = (themeId: string) => {
    setActiveTheme(themeId)
    document.documentElement.setAttribute("data-theme", themeId)
    localStorage.setItem("theme", themeId)
  }

  return (
    <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)] border border-[var(--border-01)] rounded-[var(--radius)]">
      {THEMES.map((theme) => {
        const IconComponent = theme.icon
        const isActive = activeTheme === theme.id
        return (
          <button
            type="button"
            key={theme.id}
            onClick={() => changeTheme(theme.id)}
            title={`Tema ${theme.name}`}
            aria-label={`Tema ${theme.name}`}
            className={`p-1.5 rounded-[calc(var(--radius)*0.7)] transition-all duration-200 hover:bg-[var(--bg-raised)]`}
            style={{
              color: isActive ? theme.color : "var(--text-03)",
              backgroundColor: isActive ? "var(--bg-raised)" : "transparent",
              boxShadow: isActive ? "0 0 8px rgba(0, 0, 0, 0.15)" : "none",
            }}
          >
            <IconComponent size={14} className="transition-transform duration-300 hover:scale-110" />
            <span className="sr-only">Tema {theme.name}</span>
          </button>
        )
      })}
    </div>
  )
}
