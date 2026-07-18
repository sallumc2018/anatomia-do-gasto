import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE, signSession } from "@/lib/admin-auth"
import { verifyPassword } from "@/lib/admin-password"
import {
  clearAdminLoginAttempts,
  evaluateAdminLoginThrottle,
  normalizeAdminLoginKey,
  registerAdminLoginFailure,
} from "@/lib/admin-security"

export const runtime = "nodejs"

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  const firstForwarded = forwardedFor?.split(",")[0]?.trim()
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("true-client-ip")?.trim() ||
    firstForwarded ||
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}))

  const expectedUser = process.env.ADMIN_USERNAME
  const passwordHash = process.env.ADMIN_PASSWORD_HASH
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!expectedUser || !passwordHash || !secret) {
    return NextResponse.json({ error: "painel não configurado" }, { status: 500 })
  }

  const throttleKey = normalizeAdminLoginKey(expectedUser, getClientIp(req))
  const preflight = evaluateAdminLoginThrottle(throttleKey)
  if (!preflight.allowed) {
    return NextResponse.json(
      { error: "muitas tentativas; tente novamente mais tarde" },
      { status: 429, headers: { "Retry-After": String(preflight.retryAfterSeconds) } },
    )
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== expectedUser ||
    !verifyPassword(password, passwordHash)
  ) {
    const state = registerAdminLoginFailure(throttleKey)
    const status = state.backoffUntil > Date.now() || state.lockedUntil > Date.now() ? 429 : 401
    const retryAfterSeconds = status === 429
      ? Math.max(1, Math.ceil((Math.max(state.backoffUntil, state.lockedUntil) - Date.now()) / 1000))
      : undefined
    return NextResponse.json(
      { error: status === 429 ? "muitas tentativas; tente novamente mais tarde" : "credenciais inválidas" },
      retryAfterSeconds ? { status, headers: { "Retry-After": String(retryAfterSeconds) } } : { status },
    )
  }

  clearAdminLoginAttempts(throttleKey)
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
