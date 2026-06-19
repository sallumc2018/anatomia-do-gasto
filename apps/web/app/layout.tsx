import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import TheoFloatingButton from "@/components/layout/theo-floating-button"
import { globalStructuredData } from "@/lib/structured-data"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.anatomiadogasto.ong.br"),
  applicationName: "Anatomia do Gasto",
  authors: [{ name: "Anatomia do Gasto", url: "https://www.anatomiadogasto.ong.br" }],
  creator: "Anatomia do Gasto",
  publisher: "Anatomia do Gasto",
  category: "civic technology",
  title: {
    default: "Anatomia do Gasto",
    template: "%s | Anatomia do Gasto",
  },
  description:
    "Fonte cívica independente para dados fiscais públicos municipais. Organiza dados oficiais de Sorocaba e Paulínia com metodologia aberta, catálogo público, GitHub verificável e rastreabilidade.",
  keywords: [
    "transparência pública",
    "sorocaba",
    "saúde pública",
    "educação pública",
    "segurança pública",
    "transporte público",
    "orçamento público",
    "gasto público",
    "dados públicos",
    "controle social",
    "anatomia do gasto",
    "dados oficiais",
    "fonte cívica",
    "jornalismo de dados",
    "github anatomia do gasto",
    "paulínia",
    "dados fiscais públicos",
    "execução orçamentária",
    "portal da transparência",
    "prefeitura de sorocaba",
    "prefeitura de paulínia",
  ],
  alternates: {
    canonical: "https://www.anatomiadogasto.ong.br",
  },
  openGraph: {
    type: "website",
    url: "https://www.anatomiadogasto.ong.br",
    title: "Anatomia do Gasto",
    description:
      "Fonte cívica independente para dados fiscais públicos municipais, com fontes oficiais, metodologia aberta, catálogo público e código-fonte verificável.",
    siteName: "Anatomia do Gasto",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anatomia do Gasto",
    description:
      "Dados fiscais públicos municipais com fontes oficiais, metodologia aberta, catálogo público e código-fonte verificável.",
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

// Tema padrão é "carbon" (escuro) — a barra do navegador mobile acompanha o fundo.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      data-theme="carbon"
      className="h-full"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-[var(--bg-base)] text-[var(--text-01)] transition-colors duration-300">
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(globalStructuredData()),
          }}
        />
        {children}
        <TheoFloatingButton />
        <Analytics />
      </body>
    </html>
  )
}
