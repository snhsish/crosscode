import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      logger.warn("API", "POST /api/auth/api-key/generate - Unauthorized: no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("API", `POST /api/auth/api-key/generate - userId=${session.user.id}, email=${session.user.email}`)

    const apiKey = `cc_${crypto.randomBytes(24).toString("hex")}`

    await db.update(user)
      .set({ apiKey, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    logger.info("API", `POST /api/auth/api-key/generate - API key generated for userId=${session.user.id}`)
    return NextResponse.json({ apiKey })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/auth/api-key/generate - Error: ${msg}`)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
