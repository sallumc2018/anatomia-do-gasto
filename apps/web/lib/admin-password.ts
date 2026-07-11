// Hash de senha com scrypt (Node built-in — sem dependência nova).
// Usado só no runtime nodejs (login route + script de geração de hash).
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, 64)
  return `${salt.toString("hex")}:${derived.toString("hex")}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const derived = scryptSync(password, salt, 64)
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
