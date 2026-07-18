const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_BACKOFF_THRESHOLD = 3
const LOGIN_BACKOFF_BASE_MS = 5 * 1000
const LOGIN_BACKOFF_MAX_MS = 60 * 1000
const LOGIN_LOCKOUT_THRESHOLD = 6
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000

const globalState = globalThis
if (!globalState.__adgAdminSecurityState) {
  globalState.__adgAdminSecurityState = { loginAttempts: new Map() }
}

function getLoginAttemptsStore() {
  return globalState.__adgAdminSecurityState.loginAttempts
}

function normalizeAdminLoginKey(username, clientIp) {
  const safeUser = typeof username === "string" ? username.trim().toLowerCase() : "unknown"
  const safeIp = typeof clientIp === "string" ? clientIp.trim() : ""
  return `${safeIp || "unknown"}|${safeUser || "unknown"}`
}

function normalizeAdminRedirectPath(value, fallback = "/admin") {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith("/")) return fallback
  if (trimmed.startsWith("//")) return fallback
  if (trimmed.includes("\\") || trimmed.includes("://")) return fallback
  if (!trimmed.startsWith("/admin")) return fallback
  return trimmed
}

function parseOriginFromUrl(value) {
  if (typeof value !== "string" || !value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function isSameOriginRequest(requestUrl, originHeader, refererHeader) {
  let origin = null
  if (typeof originHeader === "string" && originHeader) {
    origin = parseOriginFromUrl(originHeader)
  }
  if (!origin && typeof refererHeader === "string" && refererHeader) {
    origin = parseOriginFromUrl(refererHeader)
  }
  if (!origin) return false
  try {
    return origin === new URL(requestUrl).origin
  } catch {
    return false
  }
}

function createEmptyState(now) {
  return {
    windowStartedAt: now,
    failures: 0,
    backoffUntil: 0,
    lockedUntil: 0,
  }
}

function getState(key, now) {
  const store = getLoginAttemptsStore()
  const current = store.get(key)
  if (!current) return null
  if (now - current.windowStartedAt >= LOGIN_WINDOW_MS) {
    store.delete(key)
    return null
  }
  return current
}

function pruneExpiredState(key, now) {
  const state = getState(key, now)
  if (!state) return null
  if (state.lockedUntil && state.lockedUntil <= now) {
    state.lockedUntil = 0
  }
  if (state.backoffUntil && state.backoffUntil <= now) {
    state.backoffUntil = 0
  }
  return state
}

function evaluateAdminLoginThrottle(key, now = Date.now()) {
  const state = pruneExpiredState(key, now)
  if (!state) return { allowed: true, retryAfterSeconds: 0, reason: "ok" }
  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - now) / 1000)),
      reason: "locked",
    }
  }
  if (state.backoffUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.backoffUntil - now) / 1000)),
      reason: "backoff",
    }
  }
  return { allowed: true, retryAfterSeconds: 0, reason: "ok" }
}

function registerAdminLoginFailure(key, now = Date.now()) {
  const store = getLoginAttemptsStore()
  let state = pruneExpiredState(key, now)
  if (!state) {
    state = createEmptyState(now)
  }

  state.failures += 1

  if (state.failures >= LOGIN_LOCKOUT_THRESHOLD) {
    state.lockedUntil = now + LOGIN_LOCKOUT_MS
    state.backoffUntil = 0
  } else if (state.failures >= LOGIN_BACKOFF_THRESHOLD) {
    const step = state.failures - LOGIN_BACKOFF_THRESHOLD
    state.backoffUntil = now + Math.min(LOGIN_BACKOFF_MAX_MS, LOGIN_BACKOFF_BASE_MS * 2 ** step)
  }

  store.set(key, state)
  return state
}

function clearAdminLoginAttempts(key) {
  getLoginAttemptsStore().delete(key)
}

module.exports = {
  clearAdminLoginAttempts,
  evaluateAdminLoginThrottle,
  isSameOriginRequest,
  normalizeAdminLoginKey,
  normalizeAdminRedirectPath,
  registerAdminLoginFailure,
}
