import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"
import { logger } from "../logger"

const connectionString = process.env.DATABASE_URL || ""
if (connectionString) {
  logger.info("DB", `Connecting to ${connectionString.replace(/\/\/.*@/, "//***@")}`)
} else {
  logger.warn("DB", "DATABASE_URL not set at build time (expected - available at runtime)")
}

export const sql = neon(connectionString)

logger.info("DB", "Neon HTTP driver configured")

export const db = drizzle(sql, { schema })

export { sql as client }
