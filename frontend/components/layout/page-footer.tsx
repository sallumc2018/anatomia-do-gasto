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
      { label: "Relatórios de Aplicação da LRF" },
      { label: "Portal de Transparência de Sorocaba", href: "https://fazenda.sorocaba.sp.gov.br/transparencia" },
      { label: "fazenda.sorocaba.sp.gov.br/transparencia", href: "https://fazenda.sorocaba.sp.gov.br/transparencia" },
      { label: "SIOPS — Ministério da Saúde", href: "https://siops.datasus.gov.br" },
    ],
  },
  {
    title: "Limitações declaradas",
    items: [
      { label: "Piloto: Sorocaba/SP apenas" },
      { label: "Áreas: Saúde e Educação" },
      { label: "Saúde: 2020–2025 · Educação: 2020–2025" },
      { label: "Expansão para outros municípios planejada" },
    ],
  },
  {
    title: "Princípios",
    items: [
      { label: "Dados sem interpretação editorial" },
      { label: "Limitações declaradas explicitamente" },
      { label: "Sem afiliação política" },
      { label: "Código aberto · Sem fins lucrativos" },
    ],
  },
  {
    title: "Projeto",
    items: [
      { label: "Anatomia do Gasto" },
      { label: "ONG em formação" },
      { label: "Piloto: Sorocaba/SP + UFSCar" },
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
            Anatomia do Gasto · Dados públicos extraídos dos Relatórios de
            Aplicação da LRF — Prefeitura de Sorocaba/SP. Os dados são de
            domínio público. A metodologia de extração e o código-fonte são
            abertos. Nenhum dado é editado ou selecionado para favorecer
            qualquer narrativa.
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "Política de Dados",        href: "/politica-de-dados" },
              { label: "Política de Neutralidade", href: "/politica-de-neutralidade" },
              { label: "Termos de Uso",             href: "/termos" },
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
