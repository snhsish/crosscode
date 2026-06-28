export type QrPayload = {
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
  return toBase64(JSON.stringify({ url: payload.url, v: payload.v }))
}

export function decodeQrPayload(encoded: string): QrPayload {
  const parsed = JSON.parse(fromBase64(encoded))
  if (typeof parsed.url !== 'string' || parsed.v !== 1) {
    throw new Error('Invalid QR payload')
  }
  return { url: parsed.url, v: parsed.v }
}