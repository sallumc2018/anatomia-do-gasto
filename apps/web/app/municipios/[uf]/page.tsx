import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import {
  carregarMunicipios,
  municipiosDaUf,
  AREA_LABELS,
  UF_META,
} from "@/lib/municipios-sprint2"

/**
 * Lista os municipios de UMA unidade federativa.
 *
 * Existe porque a listagem unica nao escalava: medido em producao em
 * 15/08/2026, /municipios entregava 2,74 MiB de HTML para 417 municipios
 * (~6.888 bytes cada). Com a cobertura nacional de 5.549 seriam ~36 MiB numa
 * pagina so. Por UF, o pior caso e Minas Gerais (853) em ~1,4 MiB.
 */

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  caption: { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  body: { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

// Prerendera as 27 UFs no build. Sem isto cada UF viraria uma Lambda que le
// os manifestos por requisicao — trabalho de build repetido a cada acesso.
export function generateStaticParams() {
  return Object.keys(UF_META).map((uf) => ({ uf: uf.toLowerCase() }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ uf: string }> }
): Promise<Metadata> {
  const { uf } = await params
  const meta = UF_META[uf.toUpperCase()]
  if (!meta) return { title: "Estado não encontrado — Anatomia do Gasto" }
  return {
    title: `Municípios de ${meta.nome} — Anatomia do Gasto`,
    description:
      `Transferências federais, emendas parlamentares, repasses do FNS, orçamento por função e indicadores fiscais dos municípios de ${meta.nome}.`,
    alternates: {
      canonical: `https://www.anatomiadogasto.ong.br/municipios/${uf.toLowerCase()}`,
    },
  }
}

export default async function MunicipiosUfPage(
  { params }: { params: Promise<{ uf: string }> }
) {
  const { uf } = await params
  const sigla = uf.toUpperCase()
  const meta = UF_META[sigla]
  if (!meta) notFound()

  const municipios = municipiosDaUf(carregarMunicipios(), sigla)
  const totalArquivos = municipios.reduce((acc, m) => acc + m.arquivos_total, 0)

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-12 md:py-16" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                {meta.regiao} · Expansão Nacional
              </p>
              <h1 className="font-light mb-4" style={{ fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.2, color: "var(--text-01)" }}>
                Municípios de {meta.nome}
              </h1>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "Municípios", valor: municipios.length },
                  { label: "Arquivos CSV", valor: totalArquivos },
                ].map(({ label, valor }) => (
                  <div key={label}>
                    <p style={S.label}>{label}</p>
                    <p style={{ fontSize: "26px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>
                      {valor.toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            {municipios.length === 0 ? (
              <p style={S.body}>
                Ainda não há dados publicados para {meta.nome}. A coleta nacional é contínua —
                este estado aparece assim que o primeiro município for publicado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Card enxuto de proposito: nome, IBGE, contagem e os rotulos
                    das areas. Os links de CSV moram em /municipios/[uf]/[municipio].
                    Com os ~21 links embutidos aqui, /municipios/sp pesava 4,3 MB
                    de HTML com apenas 29% da cobertura publicada — ~15 MB em 100%. */}
                {municipios.map((m) => (
                  <Link
                    key={m.key}
                    href={`/municipios/${uf.toLowerCase()}/${m.key}`}
                    className="p-4 block"
                    style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)", textDecoration: "none" }}
                  >
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)" }}>{m.nome}</p>
                    <p className="mb-2" style={S.caption}>
                      {m.ibge} · {m.arquivos_total} arquivo{m.arquivos_total !== 1 ? "s" : ""}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--teal-40)", letterSpacing: "0.04em" }}>
                      {m.areas.map((a) => AREA_LABELS[a.area] ?? a.area).join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-8 flex flex-wrap gap-4" style={S.container}>
            <Link href="/municipios" className="nav-link">← Todos os estados</Link>
            <Link href="/api/dados" className="nav-link">Catálogo de dados</Link>
            <Link href="/metodologia" className="nav-link">Metodologia</Link>
          </div>
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
