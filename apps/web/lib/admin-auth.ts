// Sessão do painel interno (/admin). Roda em dois runtimes:
// - login (route.ts, runtime nodejs): verifica senha com scrypt, assina o cookie
// - middleware.ts (runtime edge): só verifica assinatura + validade via Web Crypto
// Cookie carrega o `exp` dentro do payload assinado — não dá pra estender client-side.

export const ADMIN_SESSION_COOKIE = "adg_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 12 // 12h

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4))
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

export async function signSession(username: string, secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = JSON.stringify({ u: username, exp })
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payload))
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  const sigB64 = base64UrlEncode(new Uint8Array(sig))
  return `${payloadB64}.${sigB64}`
}

export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false
  const [payloadB64, sigB64] = token.split(".")
  if (!payloadB64 || !sigB64) return false

  try {
    const key = await hmacKey(secret)
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigB64).buffer as ArrayBuffer,
      new TextEncoder().encode(payloadB64),
    )
    if (!valid) return false

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)))
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return false
    return true
  } catch {
    return false
  }
}
