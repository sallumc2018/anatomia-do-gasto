"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { SiteSearch } from "@/components/search/SiteSearch"
import ThemeSwitcher from "@/components/ui/theme-switcher"
import { MUNICIPIOS, municipioAtivo, getMunicipio, temRota } from "@/lib/municipios"
import {
  Activity,
  GraduationCap,
  Menu,
  X,
  ChevronDown,
  MapPin,
  Coins,
  Shield,
  Bus
} from "lucide-react"

// Catálogo de links com escopo de município (rota relativa → label).
// A ordem define a prioridade: os 4 primeiros que existirem no município ativo
// viram navegação principal; o restante cai no menu "Mais".
const SCOPED_LINKS = [
  { rota: "executivo", label: "Dinheiro" },
  { rota: "camara-municipal", label: "Câmara" },
  { rota: "saude", label: "Serviços" },
  { rota: "dados", label: "Dados" },
  { rota: "receita", label: "Receita" },
  { rota: "execucao", label: "Execução" },
  { rota: "fornecedores", label: "Fornecedores" },
  { rota: "saude-fiscal", label: "Saúde Fiscal" },
  { rota: "educacao", label: "Educação" },
  { rota: "seguranca", label: "Segurança" },
  { rota: "transporte", label: "Transporte" },
  { rota: "auditoria", label: "Agentes" },
  { rota: "pacto-federativo", label: "Federativo" },
  { rota: "controle-externo", label: "Controle Externo" },
  { rota: "emendas", label: "Emendas" },
  { rota: "lacunas", label: "Lacunas" },
  { rota: "acesso-a-informacao", label: "LAI" },
  { rota: "transferencias", label: "Transferências" },
]

// Links globais (sem escopo de município) — sempre presentes no menu "Mais".
const GLOBAL_LINKS = [
  { href: "/comparativo", label: "Comparativo" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/como-citar", label: "Como citar" },
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

// Áreas-painel com ícone/cor. Só as que existem no município ativo são exibidas.
const AREAS = [
  { rota: "saude", label: "Painel de Saúde", icon: Activity, color: "#ef4444" },
  { rota: "educacao", label: "Painel de Educação", icon: GraduationCap, color: "#3b82f6" },
  { rota: "seguranca", label: "Painel de Segurança", icon: Shield, color: "#a855f7" },
  { rota: "transporte", label: "Painel de Transporte", icon: Bus, color: "#06b6d4" },
]

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

  // ── Navegação derivada do município ativo ────────────────────────────────
  const ativo = municipioAtivo(pathname)
  const municipio = getMunicipio(ativo)
  const prefixo = `/${ativo}`

  // Links com escopo, filtrados pelas rotas que existem no município ativo.
  const scopedExistentes = SCOPED_LINKS.filter((l) => temRota(ativo, l.rota)).map((l) => ({
    href: `${prefixo}/${l.rota}`,
    label: l.label,
  }))
  const MAIN_NAV = scopedExistentes.slice(0, 4)
  const MAIS_NAV = [...scopedExistentes.slice(4), ...GLOBAL_LINKS]
  const ALL_NAV = [...MAIN_NAV, ...MAIS_NAV]

  // Áreas-painel disponíveis no município ativo.
  const areasDisponiveis = AREAS.filter((a) => temRota(ativo, a.rota))

  const maisActive = MAIS_NAV.some((l) => pathname === l.href)

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
        {/* Left Side: Brand Logo & Municipality Selector */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-bold tracking-tight hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-01)", textDecoration: "none" }}
          >
            Anatomia do Gasto
          </Link>

          {/* Municipality + Area Dropdown Selector */}
          <div ref={areaRef} className="relative">
            <button
              onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
              aria-label={`Selecionar município. Município atual: ${municipio.nome}`}
              aria-expanded={areaDropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-raised)] transition-all duration-200 cursor-pointer text-[var(--text-01)]"
            >
              <MapPin size={12} style={{ color: "var(--theme-accent)" }} />
              <span>{municipio.nome}</span>
              <ChevronDown size={10} className={`text-[var(--text-03)] transition-transform duration-200 ${areaDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {areaDropdownOpen && (
              <div
                className="absolute left-0 mt-1.5 w-56 rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] shadow-lg z-50 p-1"
                role="menu"
              >
                {/* Seletor de município */}
                <span className="block px-3 pt-1.5 pb-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">
                  Município
                </span>
                {MUNICIPIOS.map((m) => {
                  const isAtivo = m.id === ativo
                  return (
                    <Link
                      key={m.id}
                      href={`/${m.id}`}
                      role="menuitem"
                      onClick={() => setAreaDropdownOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                        isAtivo ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                      }`}
                    >
                      <MapPin size={13} style={{ color: isAtivo ? "var(--theme-accent)" : "var(--text-03)" }} />
                      <span>{m.nome}</span>
                      <span className="ml-auto text-[10px] text-[var(--text-04)]">{m.uf}</span>
                    </Link>
                  )
                })}

                {/* Áreas-painel do município ativo */}
                {areasDisponiveis.length > 0 && (
                  <>
                    <div className="border-t border-[var(--border-01)] my-1"></div>
                    <span className="block px-3 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">
                      Painéis de {municipio.nome}
                    </span>
                    {areasDisponiveis.map((area) => {
                      const AreaIcon = area.icon
                      const href = `${prefixo}/${area.rota}`
                      const isActive = pathname === href
                      return (
                        <Link
                          key={area.rota}
                          href={href}
                          role="menuitem"
                          onClick={() => setAreaDropdownOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-colors ${
                            isActive ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                          }`}
                        >
                          <AreaIcon size={13} style={{ color: area.color }} />
                          <span>{area.label}</span>
                        </Link>
                      )
                    })}
                  </>
                )}

                <div className="border-t border-[var(--border-01)] my-1"></div>
                <Link
                  href={`${prefixo}/executivo`}
                  role="menuitem"
                  onClick={() => setAreaDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-md text-[var(--text-03)] hover:bg-[var(--bg-raised)] transition-colors"
                >
                  <Coins size={13} />
                  <span>Visão geral de {municipio.nome}</span>
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
                className="absolute right-0 mt-2 w-52 max-h-[420px] overflow-y-auto rounded-md border border-[var(--border-01)] bg-[var(--bg-elevated)] shadow-xl z-50 p-1"
              >
                {/* Links com escopo de município */}
                {scopedExistentes.slice(4).length > 0 && (
                  <>
                    <span className="block px-3 pt-1.5 pb-0.5 text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">
                      {municipio.nome}
                    </span>
                    {scopedExistentes.slice(4).map((link) => {
                      const isActive = pathname === link.href
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                            isActive ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                          }`}
                          onClick={() => { setOpen(false); trackEvent.navClick(link.href) }}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                    <div className="border-t border-[var(--border-01)] my-1" />
                  </>
                )}
                {/* Links globais */}
                <span className="block px-3 pt-1.5 pb-0.5 text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">
                  Geral
                </span>
                {GLOBAL_LINKS.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      className={`block px-3 py-1.5 text-xs rounded-md transition-colors ${
                        isActive ? "bg-[var(--bg-raised)] text-[var(--text-01)] font-semibold" : "text-[var(--text-02)] hover:bg-[var(--bg-raised)]"
                      }`}
                      onClick={() => { setOpen(false); trackEvent.navClick(link.href) }}
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
            {/* Municipality Switcher for Mobile */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">Município</span>
              <div className="grid grid-cols-3 gap-2">
                {MUNICIPIOS.map((m) => {
                  const isAtivo = m.id === ativo
                  return (
                    <Link
                      key={m.id}
                      href={`/${m.id}`}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                        isAtivo
                          ? "bg-[var(--bg-raised)] border-[var(--theme-accent)] text-[var(--text-01)]"
                          : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <MapPin size={14} />
                      <span>{m.nome}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quick Area Switcher for Mobile (apenas áreas existentes) */}
            {areasDisponiveis.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-04)]">Painéis de {municipio.nome}</span>
                <div className="grid grid-cols-2 gap-2">
                  {areasDisponiveis.map((area) => {
                    const AreaIcon = area.icon
                    const href = `${prefixo}/${area.rota}`
                    const isActive = pathname === href
                    return (
                      <Link
                        key={area.rota}
                        href={href}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-[var(--bg-raised)] text-[var(--text-01)]"
                            : "border-[var(--border-01)] text-[var(--text-02)] bg-[var(--bg-elevated)]"
                        }`}
                        style={isActive ? { borderColor: area.color, color: area.color } : undefined}
                      >
                        <AreaIcon size={14} />
                        <span>{area.label.replace("Painel de ", "")}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

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
