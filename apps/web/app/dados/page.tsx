import fs from "fs"
import path from "path"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

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

interface DatasetRow {
  municipio: string
  area: string
  anos: string
  status: string
  fonte: string
  observacao: string
}

function findRepoRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    if (fs.existsSync(path.join(dir, "data", "manifests", "datasets.csv"))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) return startDir
    dir = parent
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ""
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === "," && !inQuotes) {
      fields.push(cur)
      cur = ""
      continue
    }
    cur += char
  }

  fields.push(cur)
  return fields
}

function getDatasets(): DatasetRow[] {
  const filePath = path.join(findRepoRoot(process.cwd()), "data", "manifests", "datasets.csv")
  if (!fs.existsSync(filePath)) return []

  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/).filter(Boolean)
  return lines.slice(1).map((line) => {
    const [municipio, area, anos, status, fonte, observacao] = parseCsvLine(line)
    return { municipio, area, anos, status, fonte, observacao }
  })
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    public: "Publicado",
    extracted: "Extraído, pendente de validação",
    "public-mock": "Publicado como mock",
  }
  return labels[status] ?? status
}

function statusColor(status: string): string {
  if (status === "public") return "var(--support-success)"
  if (status === "extracted") return "var(--support-warning)"
  return "var(--text-03)"
}

export default function DadosPage() {
  const datasets = getDatasets()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Dados publicados</p>
              <h1 className="font-light mb-6" style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)", maxWidth: "760px" }}>
                O que já está no site e o que ainda está em validação
              </h1>
              <p style={{ ...S.body, maxWidth: "680px" }}>
                O site usa somente dados em <span style={{ color: "var(--text-01)" }}>data/public</span>.
                Arquivos extraídos, mas não validados, permanecem fora da publicação.
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
                    {["Município", "Área", "Anos", "Status", "Fonte", "Observação"].map((header) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-12" style={S.borderTop}>
              {[
                ["data/raw", "Fonte bruta preservada, como PDF ou arquivo oficial."],
                ["data/extracted", "Resultado automático dos extratores. Ainda não é publicação."],
                ["data/public", "Dados que o site oficial pode exibir."],
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
