import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  carregarMunicipio,
  AREA_LABELS,
  UF_META,
} from "@/lib/municipios-sprint2"

/**
 * Pagina de um municipio: as areas e os CSVs para download.
 *
 * POR QUE ELA EXISTE — a conta que a criou.
 * A listagem por UF embutia um <details> com um link por CSV dentro do card de
 * cada municipio: ~21 links cada. Medido no build de 15/08/2026, com apenas
 * 29% da cobertura publicada, /municipios/sp ja pesava 4,3 MB de HTML. Em 100%
 * seriam ~15 MB (645 municipios), e MG ~10 MB (853). Quebrar por UF reduziu o
 * problema mas nao o resolveu.
 *
 * Tirando os links do card, a UF passa a carregar so nome + IBGE + contagem
 * por area, e cada municipio ganha URL propria — que e tambem a arquitetura
 * correta: um municipio e uma entidade, merece endereco, titulo e canonical.
 *
 * GERACAO SOB DEMANDA, nao no build.
 * generateStaticParams devolve [] de proposito. Prerenderizar 5.571 paginas
 * multiplicaria o tempo de build (as 267 atuais levam ~21 s) para servir
 * paginas que a maioria nunca sera acessada. Com dynamicParams a primeira
 * visita gera e as seguintes vem do cache do CDN.
 */

export const dynamicParams = true

export function generateStaticParams() {
  return []
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

export async function generateMetadata(
  { params }: { params: Promise<{ uf: string; municipio: string }> }
): Promise<Metadata> {
  const { uf, municipio } = await params
  const info = carregarMunicipio(municipio)
  const meta = UF_META[uf.toUpperCase()]
  if (!info || !meta) return { title: "Município não encontrado — Anatomia do Gasto" }
  return {
    title: `${info.nome} (${info.uf}) — Anatomia do Gasto`,
    description:
      `Transferências federais, emendas parlamentares, repasses do FNS, orçamento por função e indicadores fiscais de ${info.nome}, ${meta.nome}. ${info.arquivos_total} arquivos CSV para download.`,
    alternates: {
      canonical: `https://www.anatomiadogasto.ong.br/municipios/${uf.toLowerCase()}/${municipio}`,
    },
  }
}

export default async function MunicipioPage(
  { params }: { params: Promise<{ uf: string; municipio: string }> }
) {
  const { uf, municipio } = await params
  const sigla = uf.toUpperCase()
  const meta = UF_META[sigla]
  const info = carregarMunicipio(municipio)

  // A UF da rota tem que bater com a do dado: sem isto o mesmo municipio
  // responderia em 27 URLs diferentes, o que e conteudo duplicado para busca.
  if (!meta || !info || info.uf !== sigla) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12 md:py-16" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                {meta.nome} · {meta.regiao}
              </p>
              <h1 className="font-light mb-4" style={{ fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.2, color: "var(--text-01)" }}>
                {info.nome}
              </h1>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p style={S.label}>Código IBGE</p>
                  <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {info.ibge || "—"}
                  </p>
                </div>
                <div>
                  <p style={S.label}>Arquivos CSV</p>
                  <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {info.arquivos_total}
                  </p>
                </div>
                <div>
                  <p style={S.label}>Áreas</p>
                  <p style={{ fontSize: "22px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                    {info.areas.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {info.areas.map(({ area, csvs }) => (
                <div
                  key={area}
                  className="p-4"
                  style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
                >
                  <p className="mb-1" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)" }}>
                    {AREA_LABELS[area] ?? area}
                  </p>
                  <p className="mb-3" style={S.caption}>
                    {csvs.length} arquivo{csvs.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-col gap-1">
                    {csvs.map((csv) => {
                      const ano = csv.match(/(\d{4})\.csv$/)?.[1]
                      return (
                        <a
                          key={csv}
                          href={`/api/dados/${info.key}/${area}/saida/${csv}`}
                          download
                          style={{ fontSize: "12px", color: "var(--text-02)", textDecoration: "none" }}
                          className="nav-link"
                        >
                          {ano ? `CSV ${ano}` : csv}
                        </a>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8" style={S.caption}>
              Dados públicos obtidos de APIs oficiais do governo federal (Tesouro Nacional/SICONFI,
              Portal da Transparência e Fundo Nacional de Saúde). Valores nominais em BRL.
            </p>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-8 flex flex-wrap gap-4" style={S.container}>
            <Link href={`/municipios/${uf.toLowerCase()}`} className="nav-link">← Municípios de {meta.nome}</Link>
            <Link href="/municipios" className="nav-link">Todos os estados</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
