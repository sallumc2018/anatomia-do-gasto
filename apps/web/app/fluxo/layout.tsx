import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fluxo de publicação",
  description: "Como os dados do Anatomia do Gasto percorrem o caminho da fonte oficial ao painel cidadão.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/fluxo" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
