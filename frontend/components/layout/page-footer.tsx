const S_label = {
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: "var(--text-03)",
  fontWeight: 600,
  textTransform: "uppercase" as const,
}

const S_caption = { fontSize: "12px", color: "var(--text-04)" }

const COLS = [
  {
    title: "Fontes de dados",
    items: [
      "Relatórios de Aplicação da LRF",
      "Portal de Transparência de Sorocaba",
      "fazenda.sorocaba.sp.gov.br/transparencia",
      "SIOPS — Ministério da Saúde",
    ],
  },
  {
    title: "Limitações declaradas",
    items: [
      "Piloto: Sorocaba/SP apenas",
      "Áreas: Saúde e Educação",
      "Saúde: 2020–2025 · Educação: 2024–2025",
      "Expansão para outros municípios planejada",
    ],
  },
  {
    title: "Princípios",
    items: [
      "Dados sem interpretação editorial",
      "Limitações declaradas explicitamente",
      "Sem afiliação política",
      "Código aberto · Sem fins lucrativos",
    ],
  },
  {
    title: "Projeto",
    items: [
      "Anatomia do Gasto",
      "ONG em formação",
      "Piloto: Sorocaba/SP + UFSCar",
      "Expansão nacional planejada",
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
                  <li key={item} style={{ fontSize: "13px", color: "var(--border-03)", lineHeight: "18px" }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border-01)", paddingTop: "24px" }}>
          <p style={S_caption}>
            Anatomia do Gasto · Dados públicos extraídos dos Relatórios de
            Aplicação da LRF — Prefeitura de Sorocaba/SP. Os dados são de
            domínio público. A metodologia de extração e o código-fonte são
            abertos. Nenhum dado é editado ou selecionado para favorecer
            qualquer narrativa.
          </p>
        </div>
      </div>
    </footer>
  )
}
