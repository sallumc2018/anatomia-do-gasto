import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Municípios — Anatomia do Gasto",
  description:
    "Dados federais de transferências, emendas parlamentares e repasses de saúde (FNS) para municípios do Acre, Amapá e Roraima. Série histórica disponível para download.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/municipios" },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data")

const AREA_LABELS: Record<string, string> = {
  emendas_federais: "Emendas",
  fns: "Saúde FNS",
  transferencias_federais: "Transferências",
}

const UF_LABELS: Record<string, { nome: string; regiao: string }> = {
  AC: { nome: "Acre", regiao: "Norte" },
  AP: { nome: "Amapá", regiao: "Norte" },
  RR: { nome: "Roraima", regiao: "Norte" },
}

interface MunicipioInfo {
  key: string
  ibge: string
  uf: string
  nome: string
  areas: string[]
  arquivos_total: number
}

const MUNICIPIO_MAP: MunicipioInfo[] = [
  // AC — 22 municípios
  { key: "acrelandia",           ibge: "1200013", uf: "AC", nome: "Acrelândia",           areas: ["emendas_federais","transferencias_federais"] },
  { key: "assis_brasil",         ibge: "1200054", uf: "AC", nome: "Assis Brasil",          areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "brasileia",            ibge: "1200104", uf: "AC", nome: "Brasiléia",             areas: ["emendas_federais","transferencias_federais"] },
  { key: "bujari",               ibge: "1200138", uf: "AC", nome: "Bujari",                areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "capixaba",             ibge: "1200179", uf: "AC", nome: "Capixaba",              areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "cruzeiro_do_sul",      ibge: "1200203", uf: "AC", nome: "Cruzeiro do Sul",       areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "epitaciolandia",       ibge: "1200252", uf: "AC", nome: "Epitaciolândia",        areas: ["emendas_federais","transferencias_federais"] },
  { key: "feijo",                ibge: "1200302", uf: "AC", nome: "Feijó",                 areas: ["emendas_federais","transferencias_federais"] },
  { key: "jordao",               ibge: "1200328", uf: "AC", nome: "Jordão",                areas: ["emendas_federais","transferencias_federais"] },
  { key: "mancio_lima",          ibge: "1200336", uf: "AC", nome: "Mâncio Lima",           areas: ["emendas_federais","transferencias_federais"] },
  { key: "manoel_urbano",        ibge: "1200344", uf: "AC", nome: "Manoel Urbano",         areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "marechal_thaumaturgo", ibge: "1200351", uf: "AC", nome: "Marechal Thaumaturgo",  areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "placido_de_castro",    ibge: "1200385", uf: "AC", nome: "Plácido de Castro",     areas: ["emendas_federais","transferencias_federais"] },
  { key: "porto_acre",           ibge: "1200807", uf: "AC", nome: "Porto Acre",            areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "porto_walter",         ibge: "1200393", uf: "AC", nome: "Porto Walter",          areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "rio_branco",           ibge: "1200401", uf: "AC", nome: "Rio Branco",            areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "rodrigues_alves",      ibge: "1200427", uf: "AC", nome: "Rodrigues Alves",       areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "santa_rosa_do_purus",  ibge: "1200435", uf: "AC", nome: "Santa Rosa do Purus",  areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "sena_madureira",       ibge: "1200500", uf: "AC", nome: "Sena Madureira",        areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "senador_guiomard",     ibge: "1200450", uf: "AC", nome: "Senador Guiomard",      areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "tarauaca",             ibge: "1200609", uf: "AC", nome: "Tarauacá",              areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "xapuri",               ibge: "1200708", uf: "AC", nome: "Xapuri",               areas: ["emendas_federais","fns","transferencias_federais"] },
  // AP — 16 municípios
  { key: "amapa",                ibge: "1600105", uf: "AP", nome: "Amapá",                 areas: ["emendas_federais","transferencias_federais"] },
  { key: "calcoene",             ibge: "1600204", uf: "AP", nome: "Calçoene",              areas: ["emendas_federais","transferencias_federais"] },
  { key: "cutias",               ibge: "1600212", uf: "AP", nome: "Cutias",                areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "ferreira_gomes",       ibge: "1600238", uf: "AP", nome: "Ferreira Gomes",        areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "itaubal",              ibge: "1600253", uf: "AP", nome: "Itaubal",               areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "laranjal_do_jari",     ibge: "1600279", uf: "AP", nome: "Laranjal do Jari",      areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "macapa",               ibge: "1600303", uf: "AP", nome: "Macapá",                areas: ["emendas_federais","transferencias_federais"] },
  { key: "mazagao",              ibge: "1600402", uf: "AP", nome: "Mazagão",               areas: ["emendas_federais","transferencias_federais"] },
  { key: "oiapoque",             ibge: "1600501", uf: "AP", nome: "Oiapoque",              areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "pedra_branca_do_amapari", ibge: "1600154", uf: "AP", nome: "Pedra Branca do Amapari", areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "porto_grande",         ibge: "1600535", uf: "AP", nome: "Porto Grande",          areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "pracuuba",             ibge: "1600550", uf: "AP", nome: "Pracuuba",              areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "santana",              ibge: "1600600", uf: "AP", nome: "Santana",               areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "serra_do_navio",       ibge: "1600055", uf: "AP", nome: "Serra do Navio",        areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "tartarugalzinho",      ibge: "1600709", uf: "AP", nome: "Tartarugalzinho",       areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "vitoria_do_jari",      ibge: "1600808", uf: "AP", nome: "Vitória do Jari",       areas: ["emendas_federais","fns","transferencias_federais"] },
  // RR — 15 municípios
  { key: "alto_alegre",          ibge: "1400050", uf: "RR", nome: "Alto Alegre",           areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "amajari",              ibge: "1400027", uf: "RR", nome: "Amajari",               areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "boa_vista",            ibge: "1400100", uf: "RR", nome: "Boa Vista",             areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "bonfim",               ibge: "1400159", uf: "RR", nome: "Bonfim",                areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "canta",                ibge: "1400175", uf: "RR", nome: "Cantá",                 areas: ["emendas_federais","transferencias_federais"] },
  { key: "caracarai",            ibge: "1400209", uf: "RR", nome: "Caracaraí",             areas: ["emendas_federais","transferencias_federais"] },
  { key: "caroebe",              ibge: "1400233", uf: "RR", nome: "Caroebe",               areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "iracema",              ibge: "1400282", uf: "RR", nome: "Iracema",               areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "mucajai",              ibge: "1400308", uf: "RR", nome: "Mucajaí",               areas: ["emendas_federais","transferencias_federais"] },
  { key: "normandia",            ibge: "1400407", uf: "RR", nome: "Normandia",             areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "pacaraima",            ibge: "1400456", uf: "RR", nome: "Pacaraima",             areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "rorainopolis",         ibge: "1400472", uf: "RR", nome: "Rorainópolis",          areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "sao_joao_da_baliza",   ibge: "1400506", uf: "RR", nome: "São João da Baliza",    areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "sao_luiz_do_anaua",    ibge: "1400508", uf: "RR", nome: "São Luiz do Anauá",     areas: ["emendas_federais","fns","transferencias_federais"] },
  { key: "uiramuta",             ibge: "1400704", uf: "RR", nome: "Uiramutã",              areas: ["emendas_federais","fns","transferencias_federais"] },
].map((m) => {
  // Contar arquivos disponíveis
  let total = 0
  for (const area of m.areas) {
    const saida = path.join(DATA_ROOT, "public", m.key, area, "saida")
    if (fs.existsSync(saida)) total += fs.readdirSync(saida).filter(f => f.endsWith(".csv")).length
  }
  return { ...m, arquivos_total: total }
})

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label:     { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  caption:   { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  body:      { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

export default function MunicipiosPage() {
  const porUf: Record<string, MunicipioInfo[]> = {}
  for (const m of MUNICIPIO_MAP) {
    if (!porUf[m.uf]) porUf[m.uf] = []
    porUf[m.uf].push(m)
  }

  const totalArquivos = MUNICIPIO_MAP.reduce((acc, m) => acc + m.arquivos_total, 0)
  const totalMunicipios = MUNICIPIO_MAP.length
  const totalUfs = Object.keys(porUf).length

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", borderBottom: "1px solid var(--border-01)" }}>
          <div className="mx-auto px-6 py-16 md:py-20" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--teal-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>Sprint 2 — Expansão Nacional</p>
              <h1 className="font-light mb-4" style={{ fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.2, color: "var(--text-01)", maxWidth: "720px" }}>
                Dados federais de {totalMunicipios} municípios de {totalUfs} estados
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                Transferências federais, emendas parlamentares e repasses do Fundo Nacional de Saúde (FNS)
                para todos os municípios do Acre, Amapá e Roraima. {totalArquivos} arquivos CSV prontos para
                download. Coleta diária automatizada — dados atualizados a cada 24h.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "Municípios", valor: totalMunicipios },
                  { label: "Estados", valor: totalUfs },
                  { label: "Arquivos CSV", valor: totalArquivos },
                ].map(({ label, valor }) => (
                  <div key={label}>
                    <p style={{ ...S.label }}>{label}</p>
                    <p style={{ fontSize: "28px", fontWeight: 300, color: "var(--text-01)", fontVariantNumeric: "tabular-nums" }}>{valor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Por UF */}
        {Object.entries(UF_LABELS).map(([uf, info]) => {
          const municipios = porUf[uf] ?? []
          if (!municipios.length) return null
          return (
            <section key={uf} style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
              <div className="mx-auto px-6 py-10" style={S.container}>
                <div className="flex items-baseline gap-3 mb-6">
                  <span style={{ fontSize: "18px", fontWeight: 300, color: "var(--text-01)" }}>
                    {info.nome} <span style={{ color: "var(--text-03)", fontWeight: 400 }}>({uf})</span>
                  </span>
                  <span style={S.caption}>{municipios.length} municípios · Região {info.regiao}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {municipios.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((m) => (
                    <div
                      key={m.key}
                      className="p-4"
                      style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)" }}>{m.nome}</p>
                          <p style={{ ...S.caption }}>{m.ibge} · {m.arquivos_total} arquivo{m.arquivos_total !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.areas.map((area) => {
                          const saida = path.join(DATA_ROOT, "public", m.key, area, "saida")
                          const csvs = fs.existsSync(saida)
                            ? fs.readdirSync(saida).filter(f => f.endsWith(".csv")).sort()
                            : []
                          if (csvs.length === 0) return null
                          return (
                            <details key={area} style={{ width: "100%" }}>
                              <summary
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  color: "var(--teal-40)",
                                  cursor: "pointer",
                                  listStyle: "none",
                                  padding: "4px 0",
                                }}
                              >
                                {AREA_LABELS[area] ?? area} ({csvs.length})
                              </summary>
                              <div className="flex flex-col gap-1 mt-2 ml-2">
                                {csvs.map((csv) => {
                                  const url = `/api/dados/${m.key}/${area}/saida/${csv}`
                                  const ano = csv.match(/(\d{4})\.csv$/)?.[1] ?? ""
                                  return (
                                    <a
                                      key={csv}
                                      href={url}
                                      download
                                      style={{ fontSize: "12px", color: "var(--text-02)", textDecoration: "none" }}
                                      className="nav-link"
                                    >
                                      CSV {ano}
                                    </a>
                                  )
                                })}
                              </div>
                            </details>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        })}

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
