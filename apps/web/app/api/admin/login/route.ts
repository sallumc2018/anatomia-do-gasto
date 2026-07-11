import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, signSession } from "@/lib/admin-auth"
import { verifyPassword } from "@/lib/admin-password"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}))

  const expectedUser = process.env.ADMIN_USERNAME
  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!expectedUser || !passwordHash || !secret) {
    return NextResponse.json({ error: "painel não configurado" }, { status: 500 })
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== expectedUser ||
    !verifyPassword(password, passwordHash)
  ) {
    return NextResponse.json({ error: "credenciais inválidas" }, { status: 401 })
  }

  const token = await signSession(username, secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  return res
}
