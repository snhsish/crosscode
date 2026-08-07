import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { logger } from "../logger"

const connectionString = process.env.DATABASE_URL!
logger.info("DB", `Connecting to ${connectionString.replace(/\/\/.*@/, "//***@")}`)

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

client.connect().then(() => {
  logger.info("DB", "Connection pool established")
}).catch((err: Error) => {
  logger.error("DB", `Connection pool failed: ${err.message}`)
})

export const db = drizzle(client, { schema })
