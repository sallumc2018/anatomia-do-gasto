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
    ],
  },
  {
    title: "Limitações declaradas",
    items: [
      { label: "Piloto: Sorocaba/SP apenas" },
      { label: "Áreas: Saúde, Educação, Segurança e Transporte" },
      { label: "Saúde publicada: 2020-2025", href: "/saude", internal: true },
      { label: "Educação publicada: 2020-2025", href: "/educacao", internal: true },
      { label: "Segurança publicada: 2020-2025 · DCA/SICONFI", href: "/seguranca", internal: true },
      { label: "Transporte publicada: 2020-2025 · RREO+DCA/SICONFI · subfunção única", href: "/transporte", internal: true },
      { label: "Dados por fornecedor/pessoa ainda ausentes" },
      { label: "Expansão para outros municípios planejada" },
    ],
  },
  {
    title: "Princípios",
    items: [
      { label: "Sem juízo editorial sobre os valores" },
      { label: "Rastro exibido somente quando documentado" },
      { label: "Limitações declaradas explicitamente" },
      { label: "Sem afiliação política" },
      { label: "Código aberto - Sem fins lucrativos" },
    ],
  },
  {
    title: "Projeto",
    items: [
      { label: "Anatomia do Gasto" },
      { label: "ONG em formação" },
      { label: "Piloto: Sorocaba/SP" },
      { label: "Código-fonte", href: "https://github.com/sallumc2018/anatomia-do-gasto" },
    ],
  },
]

export default function PageFooter() {
  return (
    <footer style={{ backgroundColor: "var(--bg-base)", borderTop: "1px solid var(--border-01)" }}>
      <div className="mx-auto px-6 py-12" style={{ maxWidth: "1312px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
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
