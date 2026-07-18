const test = require("node:test")
const assert = require("node:assert/strict")

const {
  clearAdminLoginAttempts,
  evaluateAdminLoginThrottle,
  isSameOriginRequest,
  normalizeAdminLoginKey,
  normalizeAdminRedirectPath,
  registerAdminLoginFailure,
} = require("./admin-security.js")

test("normalizeAdminRedirectPath keeps only internal admin paths", () => {
  assert.equal(normalizeAdminRedirectPath("/admin?tab=1"), "/admin?tab=1")
  assert.equal(normalizeAdminRedirectPath("/admin/logout"), "/admin/logout")
  assert.equal(normalizeAdminRedirectPath("https://evil.example"), "/admin")
  assert.equal(normalizeAdminRedirectPath("//evil.example"), "/admin")
  assert.equal(normalizeAdminRedirectPath("/contato"), "/admin")
})

test("isSameOriginRequest rejects cross-site POST provenance", () => {
  const url = "https://example.test/admin/logout"
  assert.equal(isSameOriginRequest(url, "https://example.test", null), true)
  assert.equal(isSameOriginRequest(url, null, "https://example.test/admin"), true)
  assert.equal(isSameOriginRequest(url, "https://evil.test", null), false)
  assert.equal(isSameOriginRequest(url, null, "https://evil.test/logout"), false)
  assert.equal(isSameOriginRequest(url, null, null), false)
})

test("admin login throttle applies backoff and lockout", () => {
  const key = normalizeAdminLoginKey("NeoLogos", "192.168.15.24")
  const start = 1_700_000_000_000

  clearAdminLoginAttempts(key)
  assert.equal(evaluateAdminLoginThrottle(key, start).allowed, true)

  registerAdminLoginFailure(key, start + 1)
  registerAdminLoginFailure(key, start + 2)
  registerAdminLoginFailure(key, start + 3)
  assert.equal(evaluateAdminLoginThrottle(key, start + 4).allowed, false)

  registerAdminLoginFailure(key, start + 6_000)
  assert.equal(evaluateAdminLoginThrottle(key, start + 6_001).allowed, false)

  registerAdminLoginFailure(key, start + 17_000)
  registerAdminLoginFailure(key, start + 38_000)
  const locked = evaluateAdminLoginThrottle(key, start + 38_001)
  assert.equal(locked.allowed, false)
  assert.equal(locked.reason, "locked")

  clearAdminLoginAttempts(key)
})
