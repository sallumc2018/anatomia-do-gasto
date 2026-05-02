import Link from "next/link"

interface ShellHeaderProps {
  nav?: { href: string; label: string }[]
}

const defaultNav = [
  { href: "/",             label: "Consultar" },
  { href: "/metodologia",  label: "Metodologia" },
  { href: "/sobre",        label: "Sobre o projeto" },
]

export default function ShellHeader({ nav = defaultNav }: ShellHeaderProps) {
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
        <nav className="hidden md:flex gap-8">
          {nav.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
