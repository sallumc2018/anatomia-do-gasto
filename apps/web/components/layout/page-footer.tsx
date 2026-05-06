const S_label = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: "var(--text-03)",
  fontWeight: 600,
  textTransform: "uppercase" as const,
}

const S_caption = { fontSize: "12px", color: "var(--text-04)" }

type FooterItem = { label: string; href?: string }

const COLS: { title: string; items: FooterItem[] }[] = [
  {
    title: "Fontes de dados",
    items: [
      { label: "Relatorios de Aplicacao da LRF" },
      { label: "Portal de Transparencia de Sorocaba", href: "https://fazenda.sorocaba.sp.gov.br/transparencia" },
      { label: "fazenda.sorocaba.sp.gov.br/transparencia", href: "https://fazenda.sorocaba.sp.gov.br/transparencia" },
      { label: "SIOPS - Ministerio da Saude", href: "https://siops.datasus.gov.br" },
    ],
  },
  {
    title: "Limitacoes declaradas",
    items: [
      { label: "Piloto: Sorocaba/SP apenas" },
      { label: "Areas: Saude e Educacao" },
      { label: "Saude publicada: 2020-2025" },
      { label: "Educacao publicada: 2020-2025" },
      { label: "Dados por fornecedor/pessoa ainda ausentes" },
      { label: "Expansao para outros municipios planejada" },
    ],
  },
  {
    title: "Principios",
    items: [
      { label: "Dados sem interpretacao editorial" },
      { label: "Rastro exibido somente quando documentado" },
      { label: "Limitacoes declaradas explicitamente" },
      { label: "Sem afiliacao politica" },
      { label: "Codigo aberto - Sem fins lucrativos" },
    ],
  },
  {
    title: "Projeto",
    items: [
      { label: "Anatomia do Gasto" },
      { label: "ONG em formacao" },
      { label: "Piloto: Sorocaba/SP + UFSCar" },
      { label: "Codigo-fonte", href: "https://github.com/sallumc2018/anatomia-do-gasto" },
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
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
                        {item.label}
                      </a>
                    ) : item.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }} className="flex flex-col gap-3">
          <p style={S_caption}>
            Anatomia do Gasto - Dados publicos extraidos dos Relatorios de
            Aplicacao da LRF e bases oficiais. O objetivo e mostrar, em linguagem
            legivel, como o dinheiro entra no governo e para onde ele vai depois.
            Quando pessoa, fornecedor, unidade ou conta bancaria nao constam no dataset
            publicado, o site declara essa ausencia em vez de inferir. A metodologia
            de extracao e o codigo-fonte sao abertos.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Politica de Dados",        href: "/politica-de-dados" },
              { label: "Politica de Neutralidade", href: "/politica-de-neutralidade" },
              { label: "Termos de Uso",            href: "/termos" },
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
