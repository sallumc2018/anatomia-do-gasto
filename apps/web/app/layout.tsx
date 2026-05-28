import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"
import { Outfit, Inter } from "next/font/google"
import TheoFloatingButton from "@/components/layout/theo-floating-button"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})


export const metadata: Metadata = {
  metadataBase: new URL("https://www.anatomiadogasto.ong.br"),
  title: {
    default: "Anatomia do Gasto",
    template: "%s | Anatomia do Gasto",
  },
  description:
    "Rastreador auditável do fluxo de dinheiro público em Sorocaba. Saúde, educação, segurança pública e transporte com fontes oficiais, metodologia aberta e dados verificáveis.",
  keywords: [
    "transparencia publica",
    "sorocaba",
    "saude publica",
    "educacao publica",
    "seguranca publica",
    "transporte publico",
    "orcamento publico",
    "gasto publico",
    "dados publicos",
    "controle social",
    "anatomia do gasto",
  ],
  alternates: {
    canonical: "https://www.anatomiadogasto.ong.br",
  },
  openGraph: {
    type: "website",
    url: "https://www.anatomiadogasto.ong.br",
    title: "Anatomia do Gasto",
    description:
      "Rastreador auditável do fluxo de dinheiro público em Sorocaba. Saúde, educação, segurança pública e transporte com fontes oficiais e metodologia aberta.",
    siteName: "Anatomia do Gasto",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anatomia do Gasto",
    description:
      "Rastreador auditável do fluxo de dinheiro público em Sorocaba. Dados públicos, fontes oficiais e metodologia aberta para saúde, educação, segurança pública e transporte.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="carbon"
      className={`${outfit.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-[var(--bg-base)] text-[var(--text-01)] transition-colors duration-300">
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        {children}
        <TheoFloatingButton />
        <Analytics />
      </body>
    </html>
  )
}
