export type QrPayload = {
  url: string
  token: string
  v: number
}

export type LoginQrPayload = {
  type: "login"
  email: string
  name: string
  tier: string
  sessionToken: string
  v: number
}

export type ConnectionQrPayload = {
  type: "connection"
  url: string
  token: string
  v: number
}

export type DeviceLinkQrPayload = {
  type: "device-link"
  token: string
  url: string
  v: number
}

function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  const bytes = new TextEncoder().encode(str)
  for (let i = 0; i < bytes.length; i += 3) {
    const b = ((bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)) >>> 0
    result += chars[(b >>> 18) & 63]
    result += chars[(b >>> 12) & 63]
    result += chars[(b >>> 6) & 63]
    result += chars[b & 63]
  }
  const pad = bytes.length % 3
  if (pad === 1) return result.slice(0, -2) + '=='
  if (pad === 2) return result.slice(0, -1) + '='
  return result
}

function fromBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup: Record<string, number> = {}
  for (let i = 0; i < 64; i++) lookup[chars[i]] = i
  const clean = str.replace(/=+$/, '')
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 4) {
    const a = lookup[clean[i]] ?? 0
    const b = lookup[clean[i + 1]] ?? 0
    const c = lookup[clean[i + 2]] ?? 0
    const d = lookup[clean[i + 3]] ?? 0
    bytes.push((a << 2) | (b >>> 4))
    if (clean[i + 2]) bytes.push(((b & 15) << 4) | (c >>> 2))
    if (clean[i + 3]) bytes.push(((c & 3) << 6) | d)
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

export function encodeQrPayload(payload: QrPayload): string {
  return toBase64(JSON.stringify({ url: payload.url, token: payload.token, v: payload.v }))
}

export function decodeQrPayload(encoded: string): QrPayload {
  const parsed = JSON.parse(fromBase64(encoded))
  if (typeof parsed.url !== 'string' || parsed.v !== 1) {
    throw new Error('Invalid QR payload')
  }
  return { url: parsed.url, token: parsed.token, v: parsed.v }
}

export function encodeLoginQrPayload(payload: LoginQrPayload): string {
  return toBase64(JSON.stringify({
    type: payload.type,
    email: payload.email,
    name: payload.name,
    tier: payload.tier,
    sessionToken: payload.sessionToken,
    v: payload.v,
  }))
}

export function decodeLoginQrPayload(encoded: string): LoginQrPayload {
  const parsed = JSON.parse(fromBase64(encoded))
  if (parsed.type !== "login" || typeof parsed.email !== "string" || parsed.v !== 1) {
    throw new Error('Invalid login QR payload')
  }
  return {
    type: parsed.type,
    email: parsed.email,
    name: parsed.name,
    tier: parsed.tier,
    sessionToken: parsed.sessionToken,
    v: parsed.v,
  }
}

export function detectQrPayloadType(encoded: string): "login" | "connection" | "device-link" {
  try {
    const parsed = JSON.parse(fromBase64(encoded))
    if (parsed.type === "login") return "login"
    if (parsed.type === "device-link") return "device-link"
  } catch {}
  return "connection"
}

export function encodeDeviceLinkQrPayload(payload: DeviceLinkQrPayload): string {
  return toBase64(JSON.stringify({
    type: payload.type,
    token: payload.token,
    url: payload.url,
    v: payload.v,
  }))
}

export function decodeDeviceLinkQrPayload(encoded: string): DeviceLinkQrPayload {
  const parsed = JSON.parse(fromBase64(encoded))
  if (parsed.type !== "device-link" || typeof parsed.token !== "string" || typeof parsed.url !== "string" || parsed.v !== 1) {
    throw new Error('Invalid device-link QR payload')
  }
  return {
    type: parsed.type,
    token: parsed.token,
    url: parsed.url,
    v: parsed.v,
  }
}

export type TunnelC2S =
  | { type: "auth"; apiKey: string; projectId: string }
  | { type: "pong" }
  | { type: "response.head"; reqId: string; status: number; headers: Record<string, string> }
  | { type: "response.chunk"; reqId: string; data: string }
  | { type: "response.end"; reqId: string }
  | { type: "response.error"; reqId: string; message: string }

export type TunnelS2C =
  | { type: "ping" }
  | { type: "auth.ok"; tunnelUrl: string }
  | { type: "auth.fail"; reason: string }
  | { type: "request"; reqId: string; method: string; path: string; headers: Record<string, string>; body?: string }