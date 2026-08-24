import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"
import { effectiveTier } from "@crosscode/shared"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== "string") {
      logger.warn("API", "POST /api/auth/api-key/validate - Bad request: no API key")
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    logger.info("API", `POST /api/auth/api-key/validate - validating key prefix=${apiKey.substring(0, 6)}...`)

    const users = await db.select().from(user).where(eq(user.apiKey, apiKey)).limit(1)

    if (users.length === 0) {
      logger.warn("API", `POST /api/auth/api-key/validate - Invalid API key: ${apiKey.substring(0, 6)}...`)
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const u = users[0]
    const tier = effectiveTier(u.tier, u.subscriptionStatus)
    logger.info("API", `POST /api/auth/api-key/validate - Valid key for email=${u.email}, tier=${tier}`)

    return NextResponse.json({
      email: u.email,
      name: u.name,
      tier,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/auth/api-key/validate - Error: ${msg}`)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
