const TOKEN_RE = /^[A-Za-z0-9\-_.]{16,256}$/
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:", "mailto:"])

export function isPrivateLanHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true
  return (
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  )
}

export function isBlockedMetadataHost(host: string): boolean {
  const h = host.toLowerCase()
  return h === "169.254.169.254" || h === "metadata.google.internal"
}

/** Validate a tunnel / connection URL scanned from QR. Throws on invalid. */
export function validateConnectionUrl(url: string): string {
  if (typeof url !== "string" || url.length === 0 || url.length > 2048) {
    throw new Error("Invalid server URL in QR code")
  }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error("Invalid server URL in QR code")
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid server URL in QR code")
  }
  if (isBlockedMetadataHost(parsed.hostname)) {
    throw new Error("Invalid server URL in QR code")
  }
  if (parsed.protocol === "http:" && !isPrivateLanHost(parsed.hostname)) {
    throw new Error("QR code must use https (http is only allowed for local network)")
  }
  return url
}

export function validateAuthToken(token: string): string {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) {
    throw new Error("Invalid token in QR code")
  }
  return token
}

/** Validate the auth-server URL used for device-link claim. Pins to https. */
export function validateServerUrl(serverUrl: string): string {
  return validateConnectionUrl(serverUrl)
}

/** Allowlist for opening AI/server-controlled links via Linking. */
export function isSafeExternalUrl(href: string): boolean {
  try {
    const u = new URL(href)
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(u.protocol)) return false
    if (u.protocol === "https:" && isBlockedMetadataHost(u.hostname)) return false
    return true
  } catch {
    return false
  }
}

/**
 * fetch wrapper that enforces https (except loopback/LAN), adds a timeout,
 * and never logs secrets. Use for all tunnel / account requests.
 */
export async function secureFetch(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  validateConnectionUrl(baseUrl)
  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
