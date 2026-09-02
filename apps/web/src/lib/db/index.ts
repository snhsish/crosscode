import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"
import * as schema from "./schema"
import { logger } from "../logger"

const connectionString = process.env.DATABASE_URL || ""
if (connectionString) {
  logger.info("DB", `Connecting to ${connectionString.replace(/\/\/.*@/, "//***@")}`)
} else {
  logger.info("DB", "DATABASE_URL not set at build time (expected - available at runtime)")
}

// neon() and drizzle() both fail if called at build time when DATABASE_URL is missing.
// Lazily initialize both on first property access / tagged-template call at runtime.

let _sql: ReturnType<typeof neon> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: NeonHttpDatabase<typeof schema> | null = null

function ensureInit(): { sql: ReturnType<typeof neon>; db: NeonHttpDatabase<typeof schema> } {
  if (!_sql) {
    _sql = neon(connectionString)
    _db = drizzle(_sql, { schema })
    logger.info("DB", "Neon HTTP driver connected")
  }
  return { sql: _sql, db: _db! }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: ReturnType<typeof neon> = new Proxy((() => {}) as any, {
  apply(_target, _thisArg, args: unknown[]) {
    const { sql } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (sql as any)(...args)
  },
  get(_target, prop) {
    const { sql } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (sql as any)[prop]
    return typeof value === "function" ? value.bind(sql) : value
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: NeonHttpDatabase<typeof schema> = new Proxy({} as any, {
  get(_target, prop) {
    const { db } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (db as any)[prop]
    return typeof value === "function" ? value.bind(db) : value
  },
})

export { sql as client }
