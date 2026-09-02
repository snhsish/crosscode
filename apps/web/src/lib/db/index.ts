import postgres from "postgres"
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "./schema"
import { logger } from "../logger"

const rawConnectionString = process.env.DATABASE_URL || ""
const connectionString = rawConnectionString.replace(/[?&]channel_binding=require/, "")

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
    })
    _db = drizzle(_client, { schema })
    logger.info("DB", "Postgres pool configured (lazy connect)")
  }
  return { client: _client, db: _db! }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const client: ReturnType<typeof postgres> = new Proxy((() => {}) as any, {
  apply(_target, _thisArg, args: unknown[]) {
    const { client } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)(...args)
  },
  get(_target, prop) {
    const { client } = ensureInit()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    return typeof value === "function" ? value.bind(client) : value
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
