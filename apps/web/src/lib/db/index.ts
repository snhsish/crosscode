import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { logger } from "../logger"

const connectionString = process.env.DATABASE_URL || ""
if (connectionString) {
  logger.info("DB", `Connecting to ${connectionString.replace(/\/\/.*@/, "//***@")}`)
} else {
  logger.warn("DB", "DATABASE_URL not set at build time (expected - available at runtime)")
}

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  keep_alive: 60,
  connection: {
    statement_timeout: 30000,
  },
  onnotice: () => {},
})

logger.info("DB", "Connection pool configured (lazy connect)")

export const db = drizzle(client, { schema })
