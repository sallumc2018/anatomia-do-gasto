import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const DATA_ROOT = path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "public"))

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params

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

  if (!resolved.startsWith(DATA_ROOT + path.sep) && resolved !== DATA_ROOT) {
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
