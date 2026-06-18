import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public")

// Large Sorocaba directories (90MB+44MB+58MB = 192MB combined) exceed the Lambda budget
// when added to the framework overhead. Redirect to GitHub Raw for direct CDN delivery.
// Repo is public: https://github.com/sallumc2018/anatomia-do-gasto
const GITHUB_RAW = "https://raw.githubusercontent.com/sallumc2018/anatomia-do-gasto/main/data/public"
const LARGE_SOROCABA_DIRS = new Set(["despesa", "autarquias", "empenho"])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params

  // Large Sorocaba directories served via GitHub Raw CDN to stay within 250MB Lambda limit.
  if (slug[0] === "sorocaba" && LARGE_SOROCABA_DIRS.has(slug[1])) {
    return NextResponse.redirect(`${GITHUB_RAW}/${slug.join("/")}`, { status: 302 })
  }

  const filename = slug[slug.length - 1] ?? ""
  const contentTypes: Record<string, string> = {
    ".csv": "text/csv; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jsonld": "application/ld+json; charset=utf-8",
    ".ttl": "text/turtle; charset=utf-8",
  }
  const ext = path.extname(filename).toLowerCase()
  const contentType = contentTypes[ext]

  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const resolved = path.resolve(path.join(DATA_ROOT, ...slug))
  const dataRootResolved = path.resolve(DATA_ROOT)

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
    },
  })
}
