import Link from "next/link"
import { TrackedExternalLink } from "@/components/analytics/tracked-link"

const S_label = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: "var(--text-03)",
  fontWeight: 600,
  textTransform: "uppercase" as const,
}

const S_caption = { fontSize: "12px", color: "var(--text-04)" }

type FooterItem = { label: string; href?: string; internal?: boolean }

const COLS: { title: string; items: FooterItem[] }[] = [
  {
    title: "Fontes de dados",
    items: [
      { label: "Relatórios de Aplicação da LRF" },
      { label: "Portal de Transparência de Sorocaba", href: "https://fazenda.sorocaba.sp.gov.br/transparencia" },
      { label: "SIOPS - Ministério da Saúde", href: "https://siops.datasus.gov.br" },
      { label: "SICONFI - Tesouro Nacional", href: "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca" },
      { label: "Metodologia completa", href: "/metodologia", internal: true },
    ],
  },
  {
    title: "Contato e projeto",
    items: [
      { label: "contato@anatomiadogasto.ong.br", href: "mailto:contato@anatomiadogasto.ong.br" },
      { label: "Página de contato", href: "/contato", internal: true },
      { label: "Sobre o projeto", href: "/sobre", internal: true },
      { label: "Código-fonte", href: "https://github.com/sallumc2018/anatomia-do-gasto" },
      { label: "Issues e erros nos dados", href: "https://github.com/sallumc2018/anatomia-do-gasto/issues" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Política de Dados", href: "/politica-de-dados", internal: true },
      { label: "Termos de Uso", href: "/termos", internal: true },
      { label: "Sem afiliação política · Sem fins lucrativos" },
    ],
  },
]

export default function PageFooter() {
  return (
    <footer style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)" }}>
      <div className="mx-auto px-6 py-12" style={{ maxWidth: "1312px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="uppercase font-semibold mb-4" style={S_label}>
                {col.title}
              </p>
              <ul className="flex flex-col gap-2">
                {col.items.map((item) => (
                  <li key={item.label} style={{ fontSize: "13px", color: "var(--border-03)", lineHeight: "18px" }}>
                    {item.internal && item.href ? (
                      <Link href={item.href} style={{ color: "inherit", textDecoration: "underline" }}>
                        {item.label}
                      </Link>
                    ) : item.href ? (
                      <TrackedExternalLink href={item.href} area="footer" label={item.label} style={{ color: "inherit", textDecoration: "underline" }}>
                        {item.label}
                      </TrackedExternalLink>
                    ) : item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }} className="flex flex-col gap-3">
          <p style={S_caption}>
            Anatomia do Gasto - Dados públicos extraídos de relatórios oficiais,
            portais municipais e bases federais como SIOPS e SICONFI. O objetivo é
            mostrar, em linguagem legível, como o dinheiro entra no governo e para
            onde ele vai depois. Quando pessoa, fornecedor, unidade ou conta bancária
            não constam no dataset publicado, o site declara essa ausência em vez de
            inferir. A metodologia de extração e o código-fonte são abertos.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Política de Dados", href: "/politica-de-dados" },
              { label: "Política de Neutralidade", href: "/politica-de-neutralidade" },
              { label: "Termos de Uso", href: "/termos" },
            ].map((link) => (
              <a key={link.href} href={link.href} style={{ ...S_caption, textDecoration: "underline", color: "var(--text-04)" }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
