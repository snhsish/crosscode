import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  keep_alive: 60,
  connection: {
    statement_timeout: 30000,
  },
})
export const db = drizzle(client, { schema })
