import dns from "node:dns"
import postgres from "postgres"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "./schema"
import { logger } from "../logger"

try {
  dns.setDefaultResultOrder("ipv4first")
} catch {}
const origLookup = dns.lookup
// @ts-ignore
dns.lookup = function patchedLookup(hostname: string, opts: unknown, cb: unknown) {
  const callback = (typeof opts === "function" ? opts : cb) as (err: unknown, addr: unknown, fam: unknown) => void
  const options = typeof opts === "object" && opts !== null ? (opts as Record<string, unknown>) : {}
  if (typeof hostname === "string" && hostname.includes("neon.tech")) {
    const ipv4Opts = { ...options, family: 4, all: true } as unknown as Parameters<typeof dns.lookup>[1]
    return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, ipv4Opts, (err: unknown, addrs: unknown) => {
      if (!err && Array.isArray(addrs) && addrs.length > 0) return callback(null, addrs, 4)
      return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, options as never, callback as never)
    })
  }
  return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, opts as never, cb as never)
} as unknown as typeof dns.lookup

const rawConnectionString = process.env.DATABASE_URL || ""
let connectionString = rawConnectionString.replace(/[?&]channel_binding=require/, "")

if (connectionString.includes(".neon.tech") && !connectionString.includes("-pooler")) {
  const pooled = connectionString.replace(/([a-z0-9-]+)\.c-/, "$1-pooler.c-")
  logger.info("DB", `Using pooled endpoint: ${pooled.replace(/\/\/.*@/, "//***@")}`)
  connectionString = pooled
}

if (connectionString) {
  logger.info("DB", `Connecting to ${connectionString.replace(/\/\/.*@/, "//***@")}`)
} else {
  logger.info("DB", "DATABASE_URL not set at build time (expected - available at runtime)")
}

let _client: ReturnType<typeof postgres> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: PostgresJsDatabase<typeof schema> | null = null

function ensureInit(): { client: ReturnType<typeof postgres>; db: PostgresJsDatabase<typeof schema> } {
  if (!_client) {
    _client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 30,
      max_lifetime: 60 * 30,
      fetch_types: false,
      onnotice: () => {},
      transform: { undefined: null },
      debug: false,
    })
    _db = drizzle(_client, { schema })
    logger.info("DB", "Postgres pool configured (lazy connect)")
  }
  return { client: _client, db: _db! }
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      const code = (err as { code?: string })?.code
      if (code !== "ETIMEDOUT" && !msg.includes("ETIMEDOUT") && !msg.includes("fetch failed") && !msg.includes("AggregateError")) break
      if (attempt < 3) {
        const delay = attempt * 2000
        logger.warn("DB", `${label} attempt ${attempt} failed (${code || msg.slice(0, 80)}), retrying in ${delay}ms`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const client: ReturnType<typeof postgres> = new Proxy((() => {}) as any, {
  apply(_target, _thisArg, args: unknown[]) {
    const { client } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return withRetry(() => (client as any)(...args), "client.query")
  },
  get(_target, prop) {
    const { client } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    if (typeof value !== "function") return value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (...a: any[]) => withRetry(() => value.bind(client)(...a), `client.${String(prop)}`)
  },
})

export const sql = client

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as any, {
  get(_target, prop) {
    const { db } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (db as any)[prop]
    return typeof value === "function" ? value.bind(db) : value
  },
})
