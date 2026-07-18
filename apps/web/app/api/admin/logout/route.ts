import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"
import { isSameOriginRequest } from "@/lib/admin-security"

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req.url, req.headers.get("origin"), req.headers.get("referer"))) {
    return NextResponse.json({ error: "origem inválida" }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  return res
}
