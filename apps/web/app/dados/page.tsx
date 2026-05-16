import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"
import { AvisoMaturidade } from "@/components/ui/aviso-maturidade"

export const metadata: Metadata = {
  title: "Dados",
  description: "Datasets abertos de gastos publicos de Sorocaba em saude, educacao, seguranca e transporte. CSVs gerados a partir de fontes oficiais, com rastreabilidade ate a fonte.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/dados" },
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
}

const PUBLIC_DATASETS = [
  ["saude", "2020-2025", "Portal de Transparencia Sorocaba", "Despesas por funcao - saude.", "despesas_saude_sorocaba_{ano}.csv"],
  ["saude", "2020-2025", "Portal de Transparencia Sorocaba", "Receitas base ASPS - saude.", "receitas_base_saude_sorocaba_{ano}.csv"],
  ["educacao", "2020-2025", "Portal de Transparencia Sorocaba", "Despesas por funcao - educacao.", "despesas_educacao_sorocaba_{ano}.csv"],
  ["educacao", "2020-2025", "Portal de Transparencia Sorocaba", "Receitas base FUNDEB - educacao.", "receitas_base_educacao_sorocaba_{ano}.csv"],
  ["seguranca", "2020-2025", "SICONFI / Tesouro Nacional", "Despesas por subfuncao - DCA Anexo I-E.", "despesas_seguranca_sorocaba_{ano}.csv"],
  ["seguranca", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento RREO Anexo 02 bimestre 6.", "rreo_seguranca_sorocaba_{ano}.csv"],
  ["transporte", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento RREO Anexo 02 bimestre 6 funcao 26.", "rreo_transporte_sorocaba_{ano}.csv"],
  ["transporte", "2020-2025", "SICONFI / Tesouro Nacional", "Despesas DCA Anexo I-E funcao 26.", "dca_transporte_sorocaba_{ano}.csv"],
  ["executivo", "2020-2025", "SICONFI / Tesouro Nacional", "Orcamento municipal por funcao.", "despesas_executivo_sorocaba_{ano}.csv"],
  ["receita", "2020-2025", "SICONFI / Tesouro Nacional", "Receitas municipais por categoria.", "receitas_sorocaba_{ano}.csv"],
  ["fiscal", "2020-2025", "SICONFI / Tesouro Nacional", "Divida, pessoal, RCL e demonstrativos fiscais complementares.", "divida_sorocaba_{ano}.csv"],
] as const

function getDatasets(): DatasetRow[] {
  const publicRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")

  return PUBLIC_DATASETS.map(([areaKey, anosStr, fonte, observacao, arquivoPadrao]) => {
    const downloadLinks: DownloadLink[] = expandYears(anosStr)
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
      area: AREA_LABEL[areaKey] ?? areaKey,
      anos: anosStr,
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
