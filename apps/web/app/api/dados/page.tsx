import type { Metadata } from "next"
import fs from "fs"
import path from "path"
import ShellHeader from "@/components/layout/shell-header"
import PageFooter from "@/components/layout/page-footer"

export const metadata: Metadata = {
  title: "Catalogo de dados — Anatomia do Gasto",
  description:
    "Catalogo publico dos arquivos CSV realmente disponiveis em data/public no Anatomia do Gasto.",
  alternates: { canonical: "https://www.anatomiadogasto.ong.br/api/dados" },
}

const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..")
const DATA_PUBLIC_ROOT = path.join(ROOT, "data", "public")
const DATASETS_MANIFEST = path.join(ROOT, "data", "manifests", "datasets.csv")

const S = {
  container: { maxWidth: "1312px" } as React.CSSProperties,
  label: {
    fontSize: "11px",
    letterSpacing: "0.08em",
    color: "var(--text-03)",
    fontWeight: 600,
    textTransform: "uppercase" as const,
  },
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

interface ManifestRow {
  municipio: string
  area: string
  tipo: string
  descricao: string
  anos: string
  fonte: string
  sistema: string
  frequencia: string
  arquivoPadrao: string
  origemDir: string
}

interface PublicFile {
  label: string
  href: string
}

interface CatalogItem extends ManifestRow {
  files: PublicFile[]
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      out.push(current)
      current = ""
    } else {
      current += char
    }
  }
  out.push(current)
  return out
}

function expandYears(value: string): string[] {
  const range = value.match(/^(\d{4})-(\d{4})$/)
  if (!range) return value ? [value] : []
  const start = Number(range[1])
  const end = Number(range[2])
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index))
}

function readManifest(): ManifestRow[] {
  if (!fs.existsSync(DATASETS_MANIFEST)) return []
  const lines = fs.readFileSync(DATASETS_MANIFEST, "utf-8").split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((item) => item.trim())
  const index = (name: string) => headers.indexOf(name)

  return lines.slice(1).map((line) => {
    const fields = splitCsvLine(line)
    return {
      municipio: fields[index("municipio")] ?? "",
      area: fields[index("Area")] ?? "",
      tipo: fields[index("Tipo")] ?? "",
      descricao: fields[index("Descricao")] ?? "",
      anos: fields[index("Anos")] ?? "",
      fonte: fields[index("Fonte")] ?? "",
      sistema: fields[index("Sistema")] ?? "",
      frequencia: fields[index("Frequencia")] ?? "",
      arquivoPadrao: fields[index("Arquivo_Padrao")] ?? "",
      origemDir: fields[index("Origem_Dir")] ?? "",
    }
  })
}

function fileCandidates(row: ManifestRow): PublicFile[] {
  if (!row.municipio || !row.area || !row.arquivoPadrao) return []
  const base = path.join(DATA_PUBLIC_ROOT, row.municipio, row.area, "saida")
  const names = row.arquivoPadrao.includes("{ano}")
    ? expandYears(row.anos).map((ano) => ({
        label: ano,
        filename: row.arquivoPadrao.replace("{ano}", ano),
      }))
    : [{ label: "CSV", filename: row.arquivoPadrao }]

  return names
    .filter(({ filename }) => filename.endsWith(".csv"))
    .filter(({ filename }) => fs.existsSync(path.join(base, filename)))
    .map(({ label, filename }) => ({
      label,
      href: `/api/dados/${row.municipio}/${row.area}/saida/${filename}`,
    }))
}

function getCatalog(): CatalogItem[] {
  return readManifest()
    .filter((row) => row.origemDir === "public")
    .map((row) => ({ ...row, files: fileCandidates(row) }))
    .filter((row) => row.files.length > 0)
    .sort((a, b) => `${a.municipio}-${a.area}-${a.tipo}`.localeCompare(`${b.municipio}-${b.area}-${b.tipo}`))
}

function areaLabel(area: string): string {
  return area.replace(/\//g, " / ").replace(/_/g, " ")
}

export default function ApiDadosPage() {
  const catalog = getCatalog()
  const totalFiles = catalog.reduce((sum, item) => sum + item.files.length, 0)
  const municipalities = Array.from(new Set(catalog.map((item) => item.municipio))).sort()

  return (
    <div className="min-h-screen flex flex-col">
      <ShellHeader />
      <main id="conteudo" className="flex-1">
        <section style={{ backgroundColor: "var(--bg-elevated)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-16 md:py-24" style={S.container}>
            <div style={{ borderLeft: "4px solid var(--blue-60)", paddingLeft: "24px", maxWidth: "780px" }}>
              <p className="uppercase font-semibold mb-4" style={S.label}>Catalogo de dados</p>
              <h1
                className="font-light mb-6"
                style={{ fontSize: "clamp(28px, 4vw, 48px)", lineHeight: "1.2", color: "var(--text-01)" }}
              >
                Arquivos CSV publicados e verificaveis
              </h1>
              <p style={{ ...S.body, color: "var(--text-03)" }}>
                Este catalogo lista somente arquivos existentes em `data/public`.
                Registros em extracao ou validacao local nao aparecem aqui ate passarem
                por validacao e copia explicita para publicacao.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)", ...S.borderBottom }}>
          <div className="mx-auto px-6 py-10" style={S.container}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0" style={S.borderTop}>
              {[
                ["Municipios", municipalities.join(", ") || "Nenhum"],
                ["Datasets com arquivo", String(catalog.length)],
                ["Downloads CSV", String(totalFiles)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className="py-6 md:pr-8"
                  style={{
                    borderLeft: index > 0 ? "1px solid var(--border-01)" : "none",
                    paddingLeft: index > 0 ? "32px" : 0,
                    ...S.borderBottom,
                  }}
                >
                  <p style={{ ...S.label, marginBottom: "8px" }}>{label}</p>
                  <p style={{ ...S.mono, color: "var(--text-01)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: "var(--bg-base)" }}>
          <div className="mx-auto px-6 py-14" style={S.container}>
            <div style={{ overflowX: "auto", ...S.borderTop }}>
              <table style={{ width: "100%", minWidth: "980px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={S.borderBottom}>
                    {["Municipio", "Area", "Tipo", "Anos", "Fonte", "Frequencia", "Downloads"].map((header) => (
                      <th key={header} style={{ textAlign: "left", padding: "14px 10px", ...S.label }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((item) => (
                    <tr key={`${item.municipio}-${item.area}-${item.tipo}-${item.arquivoPadrao}`} style={S.borderBottom}>
                      <td style={{ padding: "16px 10px", ...S.body }}>{item.municipio}</td>
                      <td style={{ padding: "16px 10px", ...S.body, textTransform: "capitalize" }}>{areaLabel(item.area)}</td>
                      <td style={{ padding: "16px 10px", ...S.body }}>{item.tipo.replace(/-/g, " ")}</td>
                      <td style={{ padding: "16px 10px", ...S.mono }}>{item.anos}</td>
                      <td style={{ padding: "16px 10px", ...S.body }}>{item.fonte}</td>
                      <td style={{ padding: "16px 10px", ...S.body }}>{item.frequencia}</td>
                      <td style={{ padding: "16px 10px" }}>
                        <div className="flex flex-wrap gap-1.5">
                          {item.files.map((file) => (
                            <a
                              key={`${item.arquivoPadrao}-${file.label}`}
                              href={file.href}
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
                              {file.label}
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-8" style={{ ...S.body, color: "var(--text-03)", maxWidth: "760px" }}>
              A URL de download e sempre servida por `/api/dados/...`, mas o arquivo de origem
              permanece em `data/public`. Se um dataset estiver no manifesto e nao aparecer aqui,
              o arquivo correspondente nao foi encontrado na camada publicada.
            </p>
          </div>
        </section>
      </main>
      <PageFooter />
    </div>
  )
}
