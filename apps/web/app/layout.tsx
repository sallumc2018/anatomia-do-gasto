import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Anatomia do Gasto",
  description:
    "De onde vem e para onde vai o dinheiro público, município por município.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className="h-full"
    >
      <body className="min-h-full flex flex-col antialiased">
        <a href="#conteudo" className="skip-link">
          Ir para o conteudo
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
