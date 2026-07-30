import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL!)

export async function validateApiKey(apiKey: string): Promise<{ userId: string; email: string; tier: string } | null> {
  const rows = await sql`
    SELECT id, email, tier FROM "user" WHERE api_key = ${apiKey} LIMIT 1
  `
  if (rows.length === 0) return null
  return { userId: rows[0].id, email: rows[0].email, tier: rows[0].tier }
}
