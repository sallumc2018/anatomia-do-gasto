import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import Link from "next/link"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { JsonLd } from "@/components/seo/json-ld"
import { breadcrumbSchema, datasetSchema, SITE_URL } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Educação em São Paulo — série histórica do MDE",
  description:
    "Série histórica do Mínimo de Desenvolvimento do Ensino (MDE) em São Paulo: percentual aplicado, limite constitucional de 25% e situação de cumprimento por ano. Fonte: SICONFI/Tesouro Nacional — RREO Anexo 14.",
  alternates: { canonical: `${SITE_URL}/sao-paulo/educacao/comparativo` },
}

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const ANOS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

interface SiopeAno {
  ano: number
  despesaMde: number | null
  percentualAplicado: number | null
  limiteConstitucionalPct: number | null
  situacao: string
}

const S = {
  container:    { maxWidth: "1312px" } as React.CSSProperties,
  label:        { fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-03)", fontWeight: 600, textTransform: "uppercase" } as React.CSSProperties,
  h2:           { fontSize: "28px", lineHeight: "36px", color: "var(--text-01)", fontWeight: 300, marginBottom: "12px" } as React.CSSProperties,
  h3:           { fontSize: "15px", lineHeight: "22px", color: "var(--text-01)", fontWeight: 600 } as React.CSSProperties,
  body:         { fontSize: "14px", lineHeight: "22px", color: "var(--text-02)" } as React.CSSProperties,
  small:        { fontSize: "12px", lineHeight: "18px", color: "var(--text-04)" } as React.CSSProperties,
  caption:      { fontSize: "12px", color: "var(--text-04)" } as React.CSSProperties,
  borderTop:    { borderTop:    "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

function parseNum(s: string): number | null {
  const t = (s ?? "").trim()
  if (!t) return null
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

function loadSiopeAno(ano: number): SiopeAno | null {
  const filePath = path.join(DATA_ROOT, "sao_paulo", "educacao", "saida", `siope_sao_paulo_${ano}.csv`)
  if (!fs.existsSync(filePath)) return null

  const lines = fs.readFileSync(filePath, "utf-8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter(Boolean)
  if (lines.length < 2) return null

  const headers = lines[0].split(",").map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)
  const iDespesa   = idx("despesa_mde")
  const iPct       = idx("percentual_aplicado")
  const iLimite    = idx("limite_constitucional_pct")
  const iSituacao  = idx("situacao")

  const f = lines[1].split(",")
  return {
    ano,
    despesaMde: parseNum(f[iDespesa] ?? ""),
    percentualAplicado: parseNum(f[iPct] ?? ""),
    limiteConstitucionalPct: parseNum(f[iLimite] ?? ""),
    situacao: (f[iSituacao] ?? "").trim(),
  }
}

function fmt(v: number): string {
  if (v >= 1e9) return `R$ ${(v / 1e9).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} bi`
  if (v >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function situacaoLabel(situacao: string): string {
  if (situacao === "cumprido") return "Cumprido"
  if (situacao === "nao_cumprido") return "Não cumprido"
  return "Não coletado"
}

function situacaoColor(situacao: string): string {
  if (situacao === "cumprido") return "#42be65"
  if (situacao === "nao_cumprido") return "#fa4d56"
  return "var(--text-04)"
}

const jsonLd = [
  datasetSchema({
    name: "Mínimo de Desenvolvimento do Ensino (MDE) — São Paulo",
    description:
      "Série histórica do indicador constitucional de MDE do Município de São Paulo: percentual aplicado, limite constitucional (25%) e situação de cumprimento, por ano. Fonte: RREO Anexo 14 / SICONFI. IBGE 3550308.",
    url: `${SITE_URL}/sao-paulo/educacao/comparativo`,
    temporalCoverage: `${ANOS[0]}/${ANOS[ANOS.length - 1]}`,
    spatialCoverage: "São Paulo, SP, Brasil (IBGE 3550308)",
    keywords: ["educação", "São Paulo", "SICONFI", "MDE", "RREO", "Anexo 14"],
    dateModified: "2026-07-09",
    downloadUrls: ANOS.map(
      (ano) => `${SITE_URL}/api/dados/sao_paulo/educacao/saida/siope_sao_paulo_${ano}.csv`,
    ),
  }),
  breadcrumbSchema([
    { name: "Início", url: SITE_URL },
    { name: "São Paulo", url: `${SITE_URL}/sao-paulo` },
    { name: "Educação", url: `${SITE_URL}/sao-paulo/educacao` },
    { name: "Série histórica" },
  ]),
]

export default function ComparativoEducacaoSaoPauloPage() {
  const serie: SiopeAno[] = ANOS
    .map(loadSiopeAno)
    .filter((r): r is SiopeAno => r !== null)
    .sort((a, b) => a.ano - b.ano)

  const anosComDado = serie.filter((r) => r.situacao !== "nao_coletado" && r.despesaMde !== null)
  const anosSemDado = serie.filter((r) => r.situacao === "nao_coletado" || r.despesaMde === null)

  return (
    <div className="min-h-screen flex flex-col">
      {jsonLd.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}
      <ShellHeader />
      <main id="conteudo" className="flex-1">

        {/* Hero */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14 md:py-20" style={S.container}>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/sao-paulo/educacao" style={{ ...S.small, color: "var(--text-03)", textDecoration: "none" }}>Educação</Link>
              <span style={S.small}>/</span>
              <span style={S.small}>Série histórica</span>
            </div>
            <div style={{ borderLeft: "4px solid var(--green-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-3" style={S.label}>
                Educação · São Paulo/SP · {ANOS[0]}–{ANOS[ANOS.length - 1]}
              </p>
              <h1 className="font-light mb-5" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "720px" }}>
                O cumprimento do mínimo constitucional de educação em São Paulo, ano a ano
              </h1>
              <p style={{ ...S.body, fontSize: "15px", lineHeight: "24px", maxWidth: "640px" }}>
                Esta página reúne a série histórica do indicador de Manutenção e Desenvolvimento do
                Ensino (MDE) de São Paulo: o percentual de receitas de impostos aplicado em educação
                e a comparação com o mínimo constitucional de 25%. Os dados vêm do RREO Anexo 14,
                reportado ao SICONFI/Tesouro Nacional.
              </p>
            </div>
          </div>
        </section>

        {/* O que é o MDE */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Exigência constitucional</p>
            <h2 className="font-light mb-6" style={S.h2}>O que é o Mínimo de Desenvolvimento do Ensino (MDE)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p style={{ ...S.body, marginBottom: "16px" }}>
                  A Constituição Federal (art. 212) obriga municípios a aplicar no mínimo{" "}
                  <strong style={{ color: "var(--text-01)" }}>25% das receitas resultantes de impostos</strong>{" "}
                  na manutenção e desenvolvimento do ensino — o chamado MDE.
                  O indicador é apurado e publicado pelo próprio ente no Relatório Resumido da
                  Execução Orçamentária (RREO), Anexo 14.
                </p>
                <p style={S.body}>
                  Quando o percentual aplicado fica igual ou acima de 25%, a situação é registrada
                  como &ldquo;cumprido&rdquo;. O não cumprimento pode resultar em sanções legais,
                  incluindo bloqueio de transferências voluntárias.
                </p>
              </div>
              <div className="p-6" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-01)" }}>
                <p className="font-semibold mb-4" style={S.h3}>Sobre os anos sem dado</p>
                <p style={S.body}>
                  Para São Paulo, o indicador consolidado de MDE (RREO Anexo 14) não está publicado
                  pela fonte oficial (SICONFI) em <strong style={{ color: "var(--text-01)" }}>nenhum</strong> dos
                  anos cobertos por este site ({ANOS[0]}–{ANOS[ANOS.length - 1]}). Todos aparecem como{" "}
                  <strong style={{ color: "var(--text-01)" }}>&ldquo;não coletado&rdquo;</strong> — o
                  Anatomia do Gasto nunca preenche uma lacuna com zero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Série histórica — tabela */}
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Série histórica · {ANOS[0]}–{ANOS[ANOS.length - 1]}</p>
            <h2 className="font-light mb-3" style={S.h2}>Percentual aplicado em educação por ano</h2>
            <p className="mb-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "640px" }}>
              Indicador anual do RREO Anexo 14. Anos sem publicação do indicador aparecem
              marcados como &ldquo;não coletado&rdquo;, sem valor numérico.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-01)" }}>
                    {["Ano", "Despesa MDE", "% aplicado", "Limite constitucional", "Situação"].map((h) => (
                      <th key={h} style={{
                        textAlign: h === "Ano" ? "left" : "right",
                        padding: "10px 16px 10px 0",
                        fontWeight: 600,
                        fontSize: "11px",
                        letterSpacing: "0.06em",
                        color: "var(--text-03)",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {serie.map((row) => {
                    const semDado = row.situacao === "nao_coletado" || row.despesaMde === null
                    return (
                      <tr key={row.ano} style={{ borderBottom: "1px solid var(--border-01)" }}>
                        <td style={{ padding: "14px 16px 14px 0", color: "var(--text-01)", fontWeight: 600, fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap" }}>
                          {row.ano}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: semDado ? "var(--text-04)" : "var(--text-01)" }}>
                          {row.despesaMde !== null ? fmt(row.despesaMde) : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap",
                          color: semDado ? "var(--text-04)" : row.percentualAplicado !== null && row.percentualAplicado >= 25 ? "#42be65" : "var(--text-02)" }}>
                          {row.percentualAplicado !== null ? `${row.percentualAplicado.toFixed(2)}%` : "—"}
                        </td>
                        <td style={{ padding: "14px 16px 14px 0", textAlign: "right", fontFamily: "var(--font-ibm-plex-mono)", whiteSpace: "nowrap", color: "var(--text-03)" }}>
                          {row.limiteConstitucionalPct !== null ? `${row.limiteConstitucionalPct.toFixed(0)}%` : "25%"}
                        </td>
                        <td style={{ padding: "14px 0 14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{
                            fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                            color: situacaoColor(row.situacao),
                          }}>
                            {situacaoLabel(row.situacao)}
                          </span>
                          {!semDado && (
                            <>
                              {" "}
                              <Link href={`/sao-paulo/educacao/relatorio/${row.ano}`} style={{ fontSize: "12px", color: "var(--blue-50)", textDecoration: "none" }}>
                                Ver {row.ano} →
                              </Link>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {anosSemDado.length > 0 && (
              <div className="mt-6 p-4" style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-01)" }}>
                <p style={{ ...S.small, color: "var(--text-03)" }}>
                  <strong>Anos sem indicador publicado pela fonte oficial:</strong>{" "}
                  {anosSemDado.map((r) => r.ano).join(", ")}. Isso é uma lacuna do próprio ente
                  no SICONFI, não uma falha de coleta do Anatomia do Gasto. Para a execução
                  orçamentária real da função Educação (RREO Anexo 02, com dado publicado em
                  todos os anos), veja a <Link href="/sao-paulo/educacao" style={{ color: "var(--blue-50)" }}>página principal de Educação</Link>.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Repasses FNDE — lacuna declarada, sem tabela vazia */}
        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-2" style={S.label}>Repasses federais por programa</p>
            <p style={{ ...S.body, maxWidth: "640px" }}>
              O Anatomia do Gasto ainda não publica o detalhamento de repasses do FNDE por programa
              (PDDE, PNAE, PNATE, FUNDEB) para São Paulo: não existe hoje uma fonte pública
              automatizável para esse detalhamento. Assim que uma fonte confiável estiver disponível,
              esta seção será adicionada.
            </p>
          </div>
        </section>

        {/* Fonte */}
        <section style={{ backgroundColor: "var(--bg-elevated)" }}>
          <div className="mx-auto px-6 py-12" style={S.container}>
            <p className="uppercase font-semibold mb-4" style={S.label}>Fonte e verificação</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p style={S.h3}>Documento de origem</p>
                <p className="mt-2" style={S.body}>
                  Relatório Resumido da Execução Orçamentária (RREO), Anexo 14 — Demonstrativo das
                  Receitas e Despesas com Manutenção e Desenvolvimento do Ensino — reportado ao SICONFI/Tesouro Nacional.
                </p>
              </div>
              <div>
                <p style={S.h3}>Como os dados chegam aqui</p>
                <p className="mt-2" style={S.body}>
                  Um pipeline consulta a API do SICONFI, extrai o indicador de MDE por exercício
                  e salva em arquivos CSV. Quando o SICONFI não retorna dado para um ano, o arquivo
                  registra explicitamente &ldquo;não coletado&rdquo; — não um valor zerado.
                </p>
              </div>
              <div>
                <p style={S.h3}>Links úteis</p>
                <div className="mt-2 flex flex-col gap-2">
                  <a href="https://apidatalake.tesouro.gov.br/ords/siconfi" target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    API SICONFI/Tesouro Nacional →
                  </a>
                  <Link href="/metodologia" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Como extraímos os dados →
                  </Link>
                  <Link href="/sao-paulo/educacao" style={{ fontSize: "13px", color: "var(--blue-50)", textDecoration: "none" }}>
                    Voltar para Educação →
                  </Link>
                </div>
              </div>
            </div>
            <p className="mt-6" style={S.caption}>
              Município de São Paulo — IBGE 3550308. Valores nominais em BRL.
            </p>
          </div>
        </section>

        {/* Nav para relatórios individuais */}
        {anosComDado.length > 0 && (
          <section style={{ backgroundColor: "var(--bg-base)" }}>
            <div className="mx-auto px-6 py-12" style={S.container}>
              <p className="uppercase font-semibold mb-6" style={S.label}>Relatórios detalhados por ano</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[...anosComDado].reverse().map((row) => (
                  <Link key={row.ano} href={`/sao-paulo/educacao/relatorio/${row.ano}`}
                    className="tile-link"
                    style={{ border: "1px solid var(--border-01)", padding: "16px", textAlign: "center", textDecoration: "none" }}>
                    <p className="font-mono font-semibold" style={{ fontSize: "22px", color: "var(--text-01)" }}>{row.ano}</p>
                    <p style={{ ...S.small, marginTop: "4px" }}>Ver relatório</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <PageFooter />
    </div>
  )
}
