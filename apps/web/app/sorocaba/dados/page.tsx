import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { AvisoMaturidade } from "@/components/ui/aviso-maturidade"

export const metadata: Metadata = {
  title: "Dados",
  description: "Datasets abertos de gastos publicos de Sorocaba publicados pelo Anatomia do Gasto. CSVs gerados a partir de fontes oficiais, com rastreabilidade ate a fonte e lacunas declaradas.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/sorocaba/dados" },
}

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "var(--text-02)",
  } as React.CSSProperties,
  mono: {
    fontFamily: "var(--font-ibm-plex-mono)",
    fontSize: "13px",
    color: "var(--text-03)",
  } as React.CSSProperties,
  borderTop: { borderTop: "1px solid var(--border-01)" } as React.CSSProperties,
  borderBottom: { borderBottom: "1px solid var(--border-01)" } as React.CSSProperties,
}

interface DownloadLink {
  ano: string
  url: string
}

interface DatasetRow {
  municipio: string
  area: string
  anos: string
  status: string
  fonte: string
  observacao: string
  downloadLinks: DownloadLink[]
}

function expandYears(anosStr: string): string[] {
  const m = anosStr.match(/^(\d{4})-(\d{4})$/)
  if (!m) return anosStr ? [anosStr] : []
  const start = parseInt(m[1])
  const end = parseInt(m[2])
  return Array.from({ length: end - start + 1 }, (_, i) => String(start + i))
}

const AREA_LABEL: Record<string, string> = {
  saude: "Saude",
  educacao: "Educacao",
  seguranca: "Seguranca publica",
  transporte: "Transporte",
  executivo: "Executivo",
  receita: "Receita",
  fiscal: "Saude fiscal",
  fornecedores: "Fornecedores",
  restos: "Restos a pagar",
  despesa: "Despesa orcamentaria",
  empenho: "Empenho",
  loa: "LOA - Audiencia Publica",
  "camara/gabinete": "Camara - despesas de gabinete",
}

function areaLabel(areaKey: string, tipo: string): string {
  const base = AREA_LABEL[areaKey] ?? areaKey.replace(/\//g, " / ")
  if (!tipo) return base
  const tipoLabel = tipo.replace(/-/g, " ")
  return `${base} - ${tipoLabel}`
}

const PUBLIC_DATASETS = [
  ["saude", "despesas", "2020-2025", "Portal de Transparencia Sorocaba", "Despesas por funcao - saude", "despesas_saude_sorocaba_{ano}.csv"],
  ["saude", "receitas", "2020-2025", "Portal de Transparencia Sorocaba", "Receitas base ASPS - saude", "receitas_base_saude_sorocaba_{ano}.csv"],
  ["educacao", "despesas", "2020-2025", "Portal de Transparencia Sorocaba", "Despesas por funcao - educacao", "despesas_educacao_sorocaba_{ano}.csv"],
  ["educacao", "receitas", "2020-2025", "Portal de Transparencia Sorocaba", "Receitas base FUNDEB - educacao", "receitas_base_educacao_sorocaba_{ano}.csv"],
  ["seguranca", "despesas", "2020-2025", "SICONFI / Tesouro Nacional", "Despesas por subfuncao - DCA Anexo I-E", "despesas_seguranca_sorocaba_{ano}.csv"],
  ["seguranca", "orcamento", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento RREO Anexo 02 bimestre 6 EXCETO INTRA", "rreo_seguranca_sorocaba_{ano}.csv"],
  ["transporte", "orcamento rreo", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento RREO Anexo 02 bimestre 6 funcao 26 EXCETO INTRA", "rreo_transporte_sorocaba_{ano}.csv"],
  ["transporte", "orcamento dca", "2020-2025", "SICONFI / Tesouro Nacional", "Despesas DCA Anexo I-E funcao 26 empenhado, liquidado e pago", "dca_transporte_sorocaba_{ano}.csv"],
  ["executivo", "despesas", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento municipal por funcao - RREO Anexo 02 bimestre 6", "despesas_executivo_sorocaba_{ano}.csv"],
  ["receita", "receitas", "2020-2025", "SICONFI / Tesouro Nacional", "Receitas municipais por categoria - RREO Anexo 01 bimestre 6", "receitas_sorocaba_{ano}.csv"],
  ["fiscal", "pessoal", "2020-2025", "SICONFI / Tesouro Nacional", "Despesa com pessoal e RCL ajustada - RGF Anexo 01", "pessoal_sorocaba_{ano}.csv"],
  ["fiscal", "divida", "2020-2025", "SICONFI / Tesouro Nacional", "Divida consolidada e limite de endividamento - RGF Anexo 02", "divida_sorocaba_{ano}.csv"],
  ["fiscal", "rcl", "2020-2025", "SICONFI / Tesouro Nacional", "Composicao das receitas correntes - RREO Anexo 03", "rcl_sorocaba_{ano}.csv"],
  ["fiscal", "rcl capital", "2020-2025", "SICONFI / Tesouro Nacional", "Composicao das receitas de capital - RREO Anexo 03", "rcl_capital_sorocaba_{ano}.csv"],
  ["fiscal", "divida detalhada", "2020-2025", "SICONFI / Tesouro Nacional", "Detalhamento da divida consolidada e limites - RGF Anexo 02", "divida_detalhada_sorocaba_{ano}.csv"],
  ["fiscal", "natureza despesa", "2020-2025", "SICONFI / Tesouro Nacional", "Resumo fiscal por natureza da despesa", "natureza_despesa_sorocaba_{ano}.csv"],
  ["fiscal", "rpps", "2020-2025", "SICONFI / Tesouro Nacional", "Indicadores previdenciarios e RPPS", "rpps_sorocaba_{ano}.csv"],
  ["saude", "receitas detalhamento", "2020-2025", "Portal de Transparencia Sorocaba / SICONFI", "Detalhamento auxiliar das receitas de saude", "receitas_detalhamento_sorocaba_{ano}.csv"],
  ["saude", "rreo despesas", "2020-2025", "SICONFI / Tesouro Nacional", "Despesas de saude no RREO", "rreo_despesas_saude_sorocaba_{ano}.csv"],
  ["saude", "rreo receitas sus", "2020-2025", "SICONFI / Tesouro Nacional", "Receitas SUS no RREO", "rreo_receitas_sus_sorocaba_{ano}.csv"],
  ["despesa", "registro analitico", "2020-2025", "Portal de Transparencia Sorocaba", "Registro Analitico da Despesa por fornecedor, natureza e empenho", "despesa_orcamentaria_sorocaba_{ano}.csv"],
  ["empenho", "registro empenho", "2020-2025", "Portal de Transparencia Sorocaba", "Livro Registro de Empenho por natureza da despesa e fornecedor", "empenho_sorocaba_{ano}.csv"],
  ["fornecedores", "conta corrente", "2020-2025", "Portal de Transparencia Sorocaba", "Conta Corrente de Fornecedor agregada por ano", "fornecedores_agregado_sorocaba_{ano}.csv"],
  ["restos", "restos a pagar", "2020-2025", "Portal de Transparencia Sorocaba", "Restos a Pagar agregados por fornecedor", "restos_agregado_sorocaba_{ano}.csv"],
  ["loa", "audiencia publica", "2022-2026", "Portal de Transparencia Sorocaba", "Priorizacoes da audiencia publica da LOA por area tematica e regiao", "audiencia_loa_sorocaba_{ano}.csv"],
  ["camara/gabinete", "despesas gabinete", "2020-2026", "Portal Camara Municipal de Sorocaba", "Despesas mensais dos gabinetes dos vereadores por categoria", "despesas_gabinete_camara_sorocaba_{ano}.csv"],
] as const

function getDatasets(): DatasetRow[] {
  const publicRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")

  return PUBLIC_DATASETS.map(([areaKey, tipo, anos, fonte, observacao, arquivoPadrao]) => {
    const downloadLinks: DownloadLink[] = expandYears(anos)
      .map((ano) => ({
        ano,
        filename: arquivoPadrao.replace("{ano}", ano),
      }))
      .filter(({ filename }) => fs.existsSync(path.join(publicRoot, "sorocaba", areaKey, "saida", filename)))
      .map(({ ano, filename }) => ({
        ano,
        url: `/api/dados/sorocaba/${areaKey}/saida/${filename}`,
      }))

    return {
      municipio: "Sorocaba/SP",
      area: areaLabel(areaKey, tipo),
      anos,
      status: "public",
      fonte,
      observacao,
      downloadLinks,
    }
  }).filter((dataset) => dataset.downloadLinks.length > 0)
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    public: "Publicado",
  }
  return labels[status] ?? status
}

function statusColor(status: string): string {
  if (status === "public") return "var(--support-success)"
  return "var(--text-03)"
}

export default function DadosPage() {
  const datasets = getDatasets()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DataCatalog",
            "name": "Dados públicos de Sorocaba — Anatomia do Gasto",
            "description": "Datasets abertos de gastos públicos de Sorocaba publicados pelo Anatomia do Gasto. CSVs gerados a partir de fontes oficiais, com rastreabilidade até a fonte e lacunas declaradas.",
            "url": "https://www.anatomiadogasto.ong.br/sorocaba/dados",
            "creator": { "@type": "Organization", "name": "Anatomia do Gasto", "url": "https://www.anatomiadogasto.ong.br" },
            "spatialCoverage": { "@type": "Place", "name": "Sorocaba, São Paulo, Brasil" },
            "license": "https://creativecommons.org/licenses/by/4.0/",
          }),
        }}
      />
      <AvisoMaturidade />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Dados publicados</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                Dados disponiveis para download e consulta
              </h1>
              <p style={{ ...S.body, maxWidth: "680px" }}>
                Todos os arquivos CSV usados pelo site estao abertos para download.
                Esta pagina le somente arquivos em data/public e so exibe links que existem na camada publicada.
                Arquivos ainda em validacao nao aparecem no site ate serem conferidos e copiados explicitamente para publicacao.
                Este catalogo nao representa cobertura integral de Sorocaba; as pendencias estao declaradas em /sorocaba/lacunas.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-16" style={S.container}>
            <div style={{ overflowX: "auto", ...S.borderTop }}>
              <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={S.borderBottom}>
                    {["Municipio", "Area", "Anos", "Status", "Fonte", "Observacao", "Download"].map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "16px 12px", ...S.label }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets.map((dataset) => (
                    <tr key={`${dataset.municipio}-${dataset.area}-${dataset.anos}-${dataset.status}`} style={S.borderBottom}>
                      <td style={{ padding: "18px 12px", ...S.body }}>{dataset.municipio}</td>
                      <td style={{ padding: "18px 12px", ...S.body, textTransform: "capitalize" }}>{dataset.area}</td>
                      <td style={{ padding: "18px 12px", ...S.mono }}>{dataset.anos}</td>
                      <td style={{ padding: "18px 12px", ...S.body, color: statusColor(dataset.status), fontWeight: 600 }}>
                        {statusLabel(dataset.status)}
                      </td>
                      <td style={{ padding: "18px 12px", ...S.body }}>{dataset.fonte}</td>
                      <td style={{ padding: "18px 12px", ...S.body }}>{dataset.observacao}</td>
                      <td style={{ padding: "18px 12px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {dataset.downloadLinks.map(({ ano, url }) => (
                            <a
                              key={ano}
                              href={url}
                              download
                              style={{
                                fontFamily: "var(--font-ibm-plex-mono)",
                                fontSize: "11px",
                                padding: "2px 6px",
                                border: "1px solid var(--border-01)",
                                color: "var(--blue-40)",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ano}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-12" style={S.borderTop}>
              {[
                ["Fonte oficial", "Documento ou API publicado por orgao oficial."],
                ["CSV extraido", "Tabela gerada a partir da fonte. Nao vira publicacao automaticamente."],
                ["CSV publicado", "Arquivo disponivel para download e exibido no site, lido exclusivamente de data/public."],
              ].map(([title, text]) => (
                <div key={title} className="py-8 md:pr-8" style={S.borderBottom}>
                  <p style={{ ...S.mono, color: "var(--blue-40)", marginBottom: "10px" }}>{title}</p>
                  <p style={S.body}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
