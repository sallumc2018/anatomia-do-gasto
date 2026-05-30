"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { SiteSearch } from "@/components/search/SiteSearch"
import ThemeSwitcher from "@/components/ui/theme-switcher"
import {
  Activity,
  GraduationCap,
  Menu,
  X,
  ChevronDown,
  Layers,
  Coins,
  Shield,
  Bus
} from "lucide-react"

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
  { href: "/sorocaba/controle-externo", label: "Controle Externo" },
  { href: "/sorocaba/emendas", label: "Emendas" },
  { href: "/sorocaba/lacunas", label: "Lacunas" },
  { href: "/sorocaba/acesso-a-informacao", label: "LAI" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/sobre", label: "Sobre" },
  { href: "/institucional", label: "Institucional" },
  { href: "/auditoria/reportar", label: "Reportar dados" },
  { href: "/api/dados", label: "Catálogo API" },
  { href: "/voluntarios", label: "Como contribuir" },
  { href: "/fluxo-financeiro", label: "Fluxo Financeiro" },
  { href: "/fluxo", label: "Fluxograma" },
  { href: "/mapa-interativo", label: "Mapa Interativo" },
  { href: "/sandbox", label: "Sandbox do Théo" },
]

const ALL_NAV = [...MAIN_NAV, ...MAIS_NAV]

export default function ShellHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setAreaDropdownOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false)
        setAreaDropdownOpen(false)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onOutside)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onOutside)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  // Auto-close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [pathname])

  const maisActive = MAIS_NAV.some((l) => pathname === l.href)

  // Context Area Detection
  const isSaude = pathname?.includes("/saude")
  const isEducacao = pathname?.includes("/educacao")
  const isSeguranca = pathname?.includes("/seguranca")
  const isTransporte = pathname?.includes("/transporte")

  let currentArea = { label: "Sorocaba", icon: Layers, color: "var(--text-03)" }
  if (isSaude) {
    currentArea = { label: "Saúde", icon: Activity, color: "#ef4444" }
  } else if (isEducacao) {
    currentArea = { label: "Educação", icon: GraduationCap, color: "#3b82f6" }
  } else if (isSeguranca) {
    currentArea = { label: "Segurança", icon: Shield, color: "#a855f7" }
  } else if (isTransporte) {
    currentArea = { label: "Transporte", icon: Bus, color: "#06b6d4" }
  }

  const AreaIcon = currentArea.icon

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-200 border-b backdrop-blur-md"
      style={{
        backgroundColor: "var(--header-bg)",
        borderColor: "var(--border-01)"
      }}
    >
      <div
        className="mx-auto px-6 h-14 flex items-center justify-between"
        style={{ maxWidth: "1312px" }}
      >
        {/* Left Side: Brand Logo & Intelligent Context Area Dropdown */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-01)", textDecoration: "none" }}
          >
            Anatomia do Gasto
          </Link>

          {/* Active Area Dropdown Badge Selector */}
          <div ref={areaRef} className="relative">
            <button
              onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
              aria-label={`Selecionar área. Área atual: ${currentArea.label}`}
              aria-expanded={areaDropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-raised)] transition-all duration-200 cursor-pointer text-[var(--text-01)]"
            >
              <AreaIcon size={12} style={{ color: currentArea.color }} />
              <span>{currentArea.label}</span>
              <ChevronDown size={10} className={`text-[var(--text-03)] transition-transform duration-200 ${areaDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {areaDropdownOpen && (
              <div
                className="absolute left-0 mt-1.5 w-48 rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] shadow-lg z-50 p-1"
                role="menu"
              >
                <Link
                  href="/sorocaba/saude"
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    isSaude ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                  }`}
                >
                  <Activity size={13} className="text-[#ef4444]" />
                  <span>Painel de Saúde</span>
                </Link>
                <Link
                  href="/sorocaba/educacao"
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    isEducacao ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                  }`}
                >
                  <GraduationCap size={13} className="text-[#3b82f6]" />
                  <span>Painel de Educação</span>
                </Link>
                <Link
                  href="/sorocaba/seguranca"
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    isSeguranca ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                  }`}
                >
                  <Shield size={13} className="text-[#a855f7]" />
                  <span>Painel de Segurança</span>
                </Link>
                <Link
                  href="/sorocaba/transporte"
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                    isTransporte ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                  }`}
                >
                  <Bus size={13} className="text-[#06b6d4]" />
                  <span>Painel de Transporte</span>
                </Link>
                <div className="border-t border-[var(--border-01)] my-1"></div>
                <Link
                  href="/sorocaba/executivo"
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-[var(--text-03)] hover:bg-[var(--bg-raised)] transition-colors"
                >
                  <Coins size={13} />
                  <span>Geral Sorocaba</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Navegação principal">
          {MAIN_NAV.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link font-medium relative py-1 transition-colors duration-200"
                style={{
                  color: isActive ? "var(--text-01)" : "var(--text-02)",
                  fontWeight: isActive ? 600 : 500
                }}
                aria-current={isActive ? "page" : undefined}
                onClick={() => trackEvent.navClick(link.href)}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
                    style={{ backgroundColor: "var(--theme-accent)" }}
                  />
                )}
              </Link>
            )
          })}

          <SiteSearch />

          {/* "Mais" Dropdown */}
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="nav-link font-medium flex items-center gap-1 cursor-pointer"
              style={{
                background: "none",
                border: "none",
                color: maisActive ? "var(--text-01)" : "var(--text-02)",
                fontWeight: maisActive ? 600 : 500,
              }}
            >
              <span>Mais</span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 max-h-[360px] overflow-y-auto rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] shadow-xl z-50 p-1"
              >
                {MAIS_NAV.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                        isActive ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                      }`}
                      onClick={() => {
                        setOpen(false)
                        trackEvent.navClick(link.href)
                      }}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Theme switcher */}
          <div className="border-l border-[var(--border-01)] pl-4 py-1">
            <ThemeSwitcher />
          </div>
        </nav>

        {/* Mobile Navigation Controls */}
        <div className="flex md:hidden items-center gap-3">
          <SiteSearch />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md border border-[var(--border-01)] text-[var(--text-01)] bg-[var(--bg-elevated)] cursor-pointer"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden fixed inset-0 top-14 bg-[var(--bg-base)] z-40 p-6 flex flex-col justify-between overflow-y-auto"
          style={{ height: "calc(100vh - 56px)" }}
        >
          <div className="flex flex-col gap-6">
            {/* Quick Context Switcher for Mobile */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">Área Ativa</span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/sorocaba/saude"
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                    isSaude
                      ? "bg-[var(--bg-raised)] border-[#ef4444] text-[#ef4444]"
                      : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Activity size={14} />
                  <span>Saúde</span>
                </Link>
                <Link
                  href="/sorocaba/educacao"
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                    isEducacao
                      ? "bg-[var(--bg-raised)] border-[#3b82f6] text-[#3b82f6]"
                      : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  <GraduationCap size={14} />
                  <span>Educação</span>
                </Link>
                <Link
                  href="/sorocaba/seguranca"
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                    isSeguranca
                      ? "bg-[var(--bg-raised)] border-[#a855f7] text-[#a855f7]"
                      : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Shield size={14} />
                  <span>Segurança</span>
                </Link>
                <Link
                  href="/sorocaba/transporte"
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                    isTransporte
                      ? "bg-[var(--bg-raised)] border-[#06b6d4] text-[#06b6d4]"
                      : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Bus size={14} />
                  <span>Transporte</span>
                </Link>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">Navegação</span>
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {ALL_NAV.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-xs rounded-md border transition-all text-center truncate ${
                        isActive
                          ? "bg-[var(--bg-raised)] border-[var(--theme-accent)] text-[var(--text-01)] font-semibold"
                          : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Theme switcher at bottom of drawer */}
          <div className="mt-8 border-t border-[var(--border-01)] pt-6 flex flex-col gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)] text-center">Visualização & Cores</span>
            <div className="flex justify-center">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
