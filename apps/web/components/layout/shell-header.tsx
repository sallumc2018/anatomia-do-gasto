"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { trackEvent } from "@/lib/analytics"

interface ShellHeaderProps {
  nav?: { href: string; label: string }[]
}

const defaultNav = [
  { href: "/", label: "Consultar" },
  { href: "/saude", label: "Saúde" },
  { href: "/educacao", label: "Educação" },
  { href: "/seguranca", label: "Segurança" },
  { href: "/transporte", label: "Transporte" },
  { href: "/dados", label: "Dados" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/sobre", label: "Sobre o projeto" },
]

export default function ShellHeader({ nav = defaultNav }: ShellHeaderProps) {
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--bg-base)",
        borderBottom: "1px solid var(--border-01)",
      }}
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
        <nav className="hidden md:flex gap-8" aria-label="Navegacao principal">
          {nav.map((link) => (
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
      </div>
      <nav
        className="md:hidden mobile-scroll flex gap-6 px-6 pb-3"
        aria-label="Navegacao principal"
      >
        {nav.map((link) => (
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
