import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")
const DATASETS_MANIFEST = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "manifests", "datasets.csv")

// Large Sorocaba directories (90MB+44MB+58MB = 192MB combined) exceed the Lambda budget
// when added to the framework overhead. Redirect to GitHub Raw for direct CDN delivery.
// Repo is public: https://github.com/sallumc2018/anatomia-do-gasto
const GITHUB_RAW = "https://raw.githubusercontent.com/sallumc2018/anatomia-do-gasto/main/data/public"
const LARGE_SOROCABA_DIRS = new Set(["despesa", "autarquias", "empenho"])
const CONTENT_TYPES: Record<string, string> = {
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonld": "application/ld+json; charset=utf-8",
  ".ttl": "text/turtle; charset=utf-8",
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ""
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
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

let allowedDownloadsCache: { mtimeMs: number; values: Set<string> } | null = null

function allowedDownloads(): Set<string> {
  if (!fs.existsSync(DATASETS_MANIFEST)) return new Set()
  const stat = fs.statSync(DATASETS_MANIFEST)
  if (allowedDownloadsCache && allowedDownloadsCache.mtimeMs === stat.mtimeMs) {
    return allowedDownloadsCache.values
  }

  const lines = fs.readFileSync(DATASETS_MANIFEST, "utf-8").split(/\r?\n/).filter(Boolean)
  const values = new Set<string>()
  if (lines.length >= 2) {
    const headers = splitCsvLine(lines[0]).map((item) => item.trim())
    const index = (name: string) => headers.indexOf(name)
    for (const line of lines.slice(1)) {
      const fields = splitCsvLine(line)
      const municipio = fields[index("municipio")] ?? ""
      const area = fields[index("Area")] ?? ""
      const anos = fields[index("Anos")] ?? ""
      const arquivoPadrao = fields[index("Arquivo_Padrao")] ?? ""
      const origemDir = fields[index("Origem_Dir")] ?? ""
      if (!municipio || !area || !arquivoPadrao || origemDir !== "public") continue
      const filenames = arquivoPadrao.includes("{ano}")
        ? expandYears(anos).map((ano) => arquivoPadrao.replace("{ano}", ano))
        : [arquivoPadrao]
      for (const filename of filenames) {
        if (!CONTENT_TYPES[path.extname(filename).toLowerCase()]) continue
        const rel = `${municipio}/${area}/saida/${filename}`
        values.add(rel)
      }
    }
  }

  allowedDownloadsCache = { mtimeMs: stat.mtimeMs, values }
  return values
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params
  const filename = slug[slug.length - 1] ?? ""
  const ext = path.extname(filename).toLowerCase()
  const contentType = CONTENT_TYPES[ext]

  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const rel = slug.join("/")
  if (!allowedDownloads().has(rel)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Large Sorocaba directories served via GitHub Raw CDN to stay within 250MB Lambda limit.
  if (slug[0] === "sorocaba" && LARGE_SOROCABA_DIRS.has(slug[1])) {
    return NextResponse.redirect(`${GITHUB_RAW}/${rel}`, { status: 302 })
  }

  const resolved = path.resolve(path.join(/*turbopackIgnore: true*/ DATA_ROOT, ...slug))
  const dataRootResolved = DATA_ROOT

  if (!resolved.startsWith(dataRootResolved + path.sep) && resolved !== dataRootResolved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const content = fs.readFileSync(resolved)
  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
