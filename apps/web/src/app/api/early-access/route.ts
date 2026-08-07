import { db } from "@/lib/db"
import { waitlist } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body?.email?.trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logger.warn("API", "POST /api/early-access - Bad request: invalid email")
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    logger.info("API", `POST /api/early-access - email=${email}`)

    const existing = await db
      .select({ id: waitlist.id })
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .limit(1)

    if (existing.length > 0) {
      logger.info("API", `POST /api/early-access - Already on waitlist: ${email}`)
      return NextResponse.json({ error: "Already on the waitlist" }, { status: 409 })
    }

    await db.insert(waitlist).values({ id: crypto.randomUUID(), email })
    logger.info("API", `POST /api/early-access - Added to waitlist: ${email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/early-access - Error: ${msg}`)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
