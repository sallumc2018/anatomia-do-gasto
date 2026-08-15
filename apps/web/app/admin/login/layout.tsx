import type { Metadata } from "next"

/**
 * A pagina de login e um Client Component ("use client"), e Client Components
 * nao podem exportar `metadata`. Este layout existe so para declarar o noindex.
 *
 * Sem ele a rota herdava o canonical da home, e o gate
 * tools/gates/check_canonical_routes.py reprovava com
 * "indexable page has no route-specific canonical or noindex metadata".
 *
 * Alem do gate: tela de login administrativo nao tem por que estar no indice de
 * busca. Nao e segredo — a protecao real e a autenticacao —, mas indexar um
 * formulario de credencial so serve para atrair varredura automatizada.
 */
export const metadata: Metadata = {
  title: "Acesso restrito — Anatomia do Gasto",
  robots: { index: false, follow: false },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
