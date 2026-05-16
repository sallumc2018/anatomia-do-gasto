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
  if (!filename.endsWith(".csv")) {
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
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  })
}
