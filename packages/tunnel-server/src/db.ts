import postgres from "postgres"
import { logger } from "./logger.js"

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  keep_alive: 60,
  connection: {
    statement_timeout: 30000,
  },
})

export async function validateApiKey(apiKey: string): Promise<{ userId: string; email: string; tier: string } | null> {
  logger.debug("Validating API key", { apiKey: apiKey.substring(0, 8) + "..." })
  try {
    const rows = await sql`
      SELECT id, email, tier FROM "user" WHERE api_key = ${apiKey} LIMIT 1
    `
    if (rows.length === 0) {
      logger.warn("API key not found in database", { apiKey: apiKey.substring(0, 8) + "..." })
      return null
    }
    logger.info("API key validated", { userId: rows[0].id, email: rows[0].email, tier: rows[0].tier })
    return { userId: rows[0].id, email: rows[0].email, tier: rows[0].tier }
  } catch (err) {
    logger.error("Database error during API key validation", { error: err instanceof Error ? err.message : String(err) })
    throw err
  }
}
