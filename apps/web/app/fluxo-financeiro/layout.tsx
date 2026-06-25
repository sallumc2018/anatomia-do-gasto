import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fluxo financeiro",
  description: "Visualização Sankey do fluxo de receitas e despesas municipais publicados no Anatomia do Gasto.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/fluxo-financeiro" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
