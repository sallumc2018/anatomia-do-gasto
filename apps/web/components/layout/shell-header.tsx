"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { SiteSearch } from "@/components/search/SiteSearch"

const MAIN_NAV = [
  { href: "/sorocaba/executivo", label: "Dinheiro" },
  { href: "/sorocaba/camara-municipal", label: "Câmara" },
  { href: "/sorocaba/saude", label: "Serviços" },
  { href: "/sorocaba/dados", label: "Dados" },
]

const MAIS_NAV = [
  { href: "/sorocaba/receita", label: "Receita" },
  { href: "/sorocaba/execucao", label: "Execução" },
  { href: "/sorocaba/fornecedores", label: "Fornecedores" },
  { href: "/sorocaba/saude-fiscal", label: "Saúde Fiscal" },
  { href: "/sorocaba/educacao", label: "Educação" },
  { href: "/sorocaba/seguranca", label: "Segurança" },
  { href: "/sorocaba/transporte", label: "Transporte" },
  { href: "/sorocaba/auditoria", label: "Agentes" },
  { href: "/sorocaba/pacto-federativo", label: "Federativo" },
  { href: "/sorocaba/lacunas", label: "Lacunas" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/sobre", label: "Sobre" },
]

const ALL_NAV = [...MAIN_NAV, ...MAIS_NAV]

export default function ShellHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onOutside)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const maisActive = MAIS_NAV.some((l) => pathname === l.href)

  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}
    >
      <div
        className="mx-auto px-6 h-12 flex items-center justify-between"
        style={{ maxWidth: "1312px" }}
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight"
          style={{ color: "var(--text-01)", textDecoration: "none" }}
        >
          Anatomia do Gasto
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          {MAIN_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => trackEvent.navClick(link.href)}
            >
              {link.label}
            </Link>
          ))}

          <SiteSearch />

          {/* Dropdown "Mais" */}
          <div ref={ref} style={{ position: "relative" }}>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="nav-link"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: maisActive ? "var(--text-01)" : undefined,
                fontWeight: maisActive ? 600 : undefined,
              }}
            >
              Mais
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
                aria-hidden="true"
              >
                <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  minWidth: "160px",
                  backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border-01)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  zIndex: 100,
                }}
              >
                {MAIS_NAV.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="nav-link"
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={() => { setOpen(false); trackEvent.navClick(link.href) }}
                    style={{
                      display: "block",
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--border-01)",
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile nav — horizontal scroll, todos os itens */}
      <nav
        className="md:hidden mobile-scroll flex gap-6 px-6 pb-3"
        aria-label="Navegação principal"
      >
        {ALL_NAV.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            aria-current={pathname === link.href ? "page" : undefined}
            onClick={() => trackEvent.navClick(link.href)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
