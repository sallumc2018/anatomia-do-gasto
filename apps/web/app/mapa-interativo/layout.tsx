import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mapa interativo",
  description: "Mapa interativo das dimensões fiscais cobertas pelo Anatomia do Gasto: saúde, educação, receita, controle externo e mais.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/mapa-interativo" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
