import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Municípios — Anatomia do Gasto",
  description:
    "Dados federais de transferências, emendas parlamentares e repasses de saúde (FNS) para municípios brasileiros. Série histórica disponível para download.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/municipios" },
}

// Raízes separadas com turbopackIgnore explícito em cada uma.
// turbopackIgnore precisa estar dentro do path.join() que contém process.cwd()
// para que o Turbopack ignore aquele caminho específico na fase de file-tracing.
const MANIFESTS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "manifests")

// Áreas reconhecidas na ordem em que devem aparecer
const AREAS_ORDEM = ["transferencias_federais", "emendas_federais", "fns", "executivo", "fiscal", "receita"]
const AREA_LABELS: Record<string, string> = {
  emendas_federais: "Emendas",
  fns: "Saúde FNS",
  transferencias_federais: "Transferências",
  executivo: "Orçamento",
  fiscal: "Fiscal LRF",
  receita: "Receitas",
}

// Prefixo IBGE → UF
const IBGE_UF: Record<string, string> = {
  "11": "RO", "12": "AC", "13": "AM", "14": "RR",
  "15": "PA", "16": "AP", "17": "TO",
  "21": "MA", "22": "PI", "23": "CE", "24": "RN",
  "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
  "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
  "41": "PR", "42": "SC", "43": "RS",
  "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}

const UF_META: Record<string, { nome: string; regiao: string }> = {
  AC: { nome: "Acre",             regiao: "Norte"        },
  AL: { nome: "Alagoas",         regiao: "Nordeste"     },
  AM: { nome: "Amazonas",        regiao: "Norte"        },
  AP: { nome: "Amapá",           regiao: "Norte"        },
  BA: { nome: "Bahia",           regiao: "Nordeste"     },
  CE: { nome: "Ceará",           regiao: "Nordeste"     },
  DF: { nome: "Distrito Federal", regiao: "Centro-Oeste" },
  ES: { nome: "Espírito Santo",  regiao: "Sudeste"      },
  GO: { nome: "Goiás",           regiao: "Centro-Oeste" },
  MA: { nome: "Maranhão",        regiao: "Nordeste"     },
  MG: { nome: "Minas Gerais",    regiao: "Sudeste"      },
  MS: { nome: "Mato Grosso do Sul", regiao: "Centro-Oeste" },
  MT: { nome: "Mato Grosso",     regiao: "Centro-Oeste" },
  PA: { nome: "Pará",            regiao: "Norte"        },
  PB: { nome: "Paraíba",         regiao: "Nordeste"     },
  PE: { nome: "Pernambuco",      regiao: "Nordeste"     },
  PI: { nome: "Piauí",           regiao: "Nordeste"     },
  PR: { nome: "Paraná",          regiao: "Sul"          },
  RJ: { nome: "Rio de Janeiro",  regiao: "Sudeste"      },
  RN: { nome: "Rio Grande do Norte", regiao: "Nordeste" },
  RO: { nome: "Rondônia",        regiao: "Norte"        },
  RR: { nome: "Roraima",         regiao: "Norte"        },
  RS: { nome: "Rio Grande do Sul", regiao: "Sul"        },
  SC: { nome: "Santa Catarina",  regiao: "Sul"          },
  SE: { nome: "Sergipe",         regiao: "Nordeste"     },
  SP: { nome: "São Paulo",       regiao: "Sudeste"      },
  TO: { nome: "Tocantins",       regiao: "Norte"        },
}

// Nomes com acentuação não derivável da key
const NOME_OVERRIDE: Record<string, string> = {
  acrelandia: "Acrelândia",
  amapa: "Amapá",
  brasileia: "Brasiléia",
  calcoene: "Calçoene",
  canta: "Cantá",
  caracarai: "Caracaraí",
  epitaciolandia: "Epitaciolândia",
  feijo: "Feijó",
  jordao: "Jordão",
  macapa: "Macapá",
  mancio_lima: "Mâncio Lima",
  mazagao: "Mazagão",
  mucajai: "Mucajaí",
  pacaraima: "Pacaraima",
  placido_de_castro: "Plácido de Castro",
  rorainopolis: "Rorainópolis",
  sao_joao_da_baliza: "São João da Baliza",
  sao_jose_do_rio_preto: "São José do Rio Preto",
  sao_jose_dos_campos: "São José dos Campos",
  sao_luiz_do_anaua: "São Luiz do Anauá",
  sao_vicente: "São Vicente",
  tarauaca: "Tarauacá",
  uiramuta: "Uiramutã",
  vitoria_do_jari: "Vitória do Jari",
  // SP 17
  bauru: "Bauru",
  campinas: "Campinas",
  carapicuiba: "Carapicuíba",
  diadema: "Diadema",
  guarulhos: "Guarulhos",
  itaquaquecetuba: "Itaquaquecetuba",
  jundiai: "Jundiaí",
  maua: "Mauá",
  mogi_das_cruzes: "Mogi das Cruzes",
  osasco: "Osasco",
  piracicaba: "Piracicaba",
  ribeirao_preto: "Ribeirão Preto",
  santo_andre: "Santo André",
  santos: "Santos",
}

function capitalizeKey(key: string): string {
  const skip = new Set(["do", "da", "de", "dos", "das", "e"])
  return key.split("_").map((w, i) =>
    i === 0 || !skip.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(" ")
}

interface MunicipioInfo {
  key: string
  ibge: string
  uf: string
  nome: string
  areas: { area: string; csvs: string[] }[]
  arquivos_total: number
}

interface Sprint2ManifestFile {
  arquivo?: string
  municipio_ibge?: string | number
}

interface Sprint2Manifest {
  area?: string
  arquivos?: Sprint2ManifestFile[]
}

function loadMunicipios(): MunicipioInfo[] {
  const manifestsDir = path.join(MANIFESTS_DIR, "sprint2")
  if (!fs.existsSync(manifestsDir)) return []

  const municipioKeys = fs.readdirSync(manifestsDir).filter(d => {
    const full = path.join(manifestsDir, d)
    return fs.statSync(full).isDirectory() && !d.startsWith("_")
  })

  const result: MunicipioInfo[] = []

  for (const key of municipioKeys) {
    const keyDir = path.join(manifestsDir, key)
    const manifestFiles = fs.readdirSync(keyDir).filter(f => f.endsWith(".json"))
    if (!manifestFiles.length) continue

    let ibge = ""
    const areasByName = new Map<string, string[]>()

    for (const manifestFile of manifestFiles) {
      try {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(keyDir, manifestFile), "utf-8")
        ) as Sprint2Manifest
        const area = manifest.area ?? manifestFile.replace(/\.json$/, "")
        const csvs = (manifest.arquivos ?? [])
          .map((arquivo) => arquivo.arquivo)
          .filter((arquivo): arquivo is string => Boolean(arquivo?.endsWith(".csv")))
          .sort()

        if (!ibge) {
          const manifestIbge = manifest.arquivos?.find((arquivo) => arquivo.municipio_ibge)?.municipio_ibge
          ibge = manifestIbge ? String(manifestIbge) : ""
        }

        if (csvs.length > 0) areasByName.set(area, csvs)
      } catch { /* ignora manifesto corrompido */ }
    }

    const uf = ibge.length >= 2 ? (IBGE_UF[ibge.slice(0, 2)] ?? "??") : "??"
    const nome = NOME_OVERRIDE[key] ?? capitalizeKey(key)
    const areas = AREAS_ORDEM
      .map((area) => ({ area, csvs: areasByName.get(area) ?? [] }))
      .filter(({ csvs }) => csvs.length > 0)

    const arquivos_total = areas.reduce((acc, a) => acc + a.csvs.length, 0)
    result.push({ key, ibge, uf, nome, areas, arquivos_total })
  }

  return result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label:     { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  caption:   { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  body:      { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
}

export default function MunicipiosPage() {
  const municipios = loadMunicipios()

  // Agrupar por UF
  const porUf: Record<string, MunicipioInfo[]> = {}
  for (const m of municipios) {
    if (!porUf[m.uf]) porUf[m.uf] = []
    porUf[m.uf].push(m)
  }
  const ufsOrdenadas = Object.keys(porUf).sort((a, b) => {
    const ra = UF_META[a]?.regiao ?? "Z"
    const rb = UF_META[b]?.regiao ?? "Z"
    return ra === rb ? a.localeCompare(b) : ra.localeCompare(rb)
  })

  const totalArquivos = municipios.reduce((acc, m) => acc + m.arquivos_total, 0)
  const totalMunicipios = municipios.length
  const totalUfs = ufsOrdenadas.length

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
                Dados federais de {totalMunicipios} municípios em {totalUfs} estado{totalUfs !== 1 ? "s" : ""}
              </h1>
              <p style={{ ...S.body, maxWidth: "640px", marginBottom: "16px" }}>
                Transferências federais, emendas parlamentares e repasses do Fundo Nacional de Saúde (FNS)
                para municípios brasileiros. {totalArquivos.toLocaleString("pt-BR")} arquivos CSV disponíveis
                para download. Coleta automatizada com atualização contínua.
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

        {/* Seções por UF */}
        {ufsOrdenadas.map((uf) => {
          const munis = porUf[uf].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
          const meta = UF_META[uf] ?? { nome: uf, regiao: "" }
          return (
            <section key={uf} style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-01)" }}>
              <div className="mx-auto px-6 py-10" style={S.container}>
                <div className="flex items-baseline gap-3 mb-6">
                  <span style={{ fontSize: "18px", fontWeight: 300, color: "var(--text-01)" }}>
                    {meta.nome} <span style={{ color: "var(--text-03)", fontWeight: 400 }}>({uf})</span>
                  </span>
                  <span style={S.caption}>
                    {munis.length} municípios{meta.regiao ? ` · Região ${meta.regiao}` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {munis.map((m) => (
                    <div
                      key={m.key}
                      className="p-4"
                      style={{ border: "1px solid var(--border-01)", backgroundColor: "var(--bg-elevated)" }}
                    >
                      <div className="mb-3">
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-01)" }}>{m.nome}</p>
                        <p style={S.caption}>{m.ibge} · {m.arquivos_total} arquivo{m.arquivos_total !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {m.areas.map(({ area, csvs }) => (
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
                                const ano = csv.match(/(\d{4})\.csv$/)?.[1] ?? csv
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
                        ))}
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
