import type { Metadata } from "next"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  carregarMunicipios,
  resumirPorUf,
  ORDEM_REGIOES,
} from "@/lib/municipios-sprint2"

export const metadata: Metadata = {
  title: "Municípios — Anatomia do Gasto",
  description:
    "Dados federais de transferências, emendas parlamentares, repasses de saúde (FNS), orçamento e indicadores fiscais de municípios brasileiros, organizados por estado.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/municipios" },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

export default function MunicipiosPage() {
  const municipios = carregarMunicipios()
  const ufs = resumirPorUf(municipios)

  const totalMunicipios = municipios.length
  const totalArquivos = municipios.reduce((acc, m) => acc + m.arquivos_total, 0)
  const totalUfs = ufs.length

  const porRegiao = ORDEM_REGIOES.map((regiao) => ({
    regiao,
    ufs: ufs.filter((u) => u.regiao === regiao),
  })).filter((g) => g.ufs.length > 0)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-16 md:py-20" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Expansão Nacional — Sprint 2</p>
              <h1 className="font-light mb-4" style={{ fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.2, color: "var(--text-01)", maxWidth: "720px" }}>
                Dados federais de {totalMunicipios.toLocaleString("pt-BR")} municípios em {totalUfs} estado{totalUfs !== 1 ? "s" : ""}
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                Transferências federais, emendas parlamentares, repasses do Fundo Nacional de Saúde,
                orçamento por função e indicadores fiscais da LRF.
                {" "}{totalArquivos.toLocaleString("pt-BR")} arquivos CSV para download.
                Escolha um estado para ver seus municípios.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "Municípios", valor: totalMunicipios },
                  { label: "Estados", valor: totalUfs },
                  { label: "Arquivos CSV", valor: totalArquivos },
                ].map(({ label, valor }) => (
                  <div key={label}>
                    <p style={S.label}>{label}</p>
                    <p style={{ fontSize: "28px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                      {valor.toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Estados por região */}
        {porRegiao.map(({ regiao, ufs: ufsDaRegiao }) => (
          <section key={regiao} style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
            <div className="mx-auto px-6 py-10" style={S.container}>
              <div className="flex items-baseline gap-3 mb-6">
                <span style={{ fontSize: "18px", fontWeight: 300, color: "var(--text-01)" }}>{regiao}</span>
                <span style={S.caption}>
                  {ufsDaRegiao.length} estado{ufsDaRegiao.length !== 1 ? "s" : ""} ·{" "}
                  {ufsDaRegiao.reduce((a, u) => a + u.municipios, 0).toLocaleString("pt-BR")} municípios
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ufsDaRegiao.map((u) => (
                  <Link
                    key={u.uf}
                    href={`/municipios/${u.uf.toLowerCase()}`}
                    className="p-4 block"
                    style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)", textDecoration: "none" }}
                  >
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)" }}>
                      {u.nome} <span style={{ color: "var(--text-03)", fontWeight: 400 }}>({u.uf})</span>
                    </p>
                    <p style={S.caption}>
                      {u.municipios.toLocaleString("pt-BR")} município{u.municipios !== 1 ? "s" : ""} ·{" "}
                      {u.arquivos.toLocaleString("pt-BR")} arquivo{u.arquivos !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Nota metodológica */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Transferências Federais</p>
                <p style={S.body}>Convênios e instrumentos congêneres cadastrados no Portal da Transparência
                (SICONV/Plataforma +Brasil). Abrange recursos transferidos pela União para execução
                descentralizada de políticas públicas nos municípios.</p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Emendas Parlamentares</p>
                <p style={S.body}>Emendas individuais, de bancada e de comissão de deputados federais e
                senadores destinadas a cada município. Série histórica desde 2014. Fonte: Portal da
                Transparência / Siop.</p>
              </div>
              <div>
                <p className="uppercase font-semibold mb-3" style={S.label}>Repasses FNS (Saúde)</p>
                <p style={S.body}>Repasses do Fundo Nacional de Saúde via mecanismo fundo-a-fundo ao Fundo
                Municipal de Saúde. Blocos de custeio e investimento do SUS. Fonte: fns.saude.gov.br.</p>
              </div>
            </div>
            <p className="mt-6" style={S.caption}>
              Todos os dados são públicos, obtidos de APIs oficiais do governo federal. Valores nominais em BRL.
              Município sem repasse FNS registrado pode não ter recebido via FAF no período coberto.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-8 flex flex-wrap gap-4" style={S.container}>
            <Link href="/" className="nav-link">← Início</Link>
            <Link href="/api/dados" className="nav-link">Catálogo de dados</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
