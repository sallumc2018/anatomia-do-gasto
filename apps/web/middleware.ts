import { NextRequest, NextResponse } from "next/server"

const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const ALLOW_HEADER = "GET, HEAD, OPTIONS"

export function middleware(request: NextRequest) {
  if (ALLOWED_METHODS.has(request.method)) {
    return NextResponse.next()
  }

  return new NextResponse(null, {
    status: 405,
    headers: {
      Allow: ALLOW_HEADER,
    },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
