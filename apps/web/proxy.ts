import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, verifySession } from "./lib/admin-auth"

export const config = {
  matcher: ["/admin/:path*"],
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === "/admin/login") return NextResponse.next()

  const secret = process.env.ADMIN_SESSION_SECRET
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value

  if (!secret || !(await verifySession(token, secret))) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
