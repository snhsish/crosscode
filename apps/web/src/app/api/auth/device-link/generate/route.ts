import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { encodeDeviceLinkQrPayload } from "@crosscode/shared"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      logger.warn("API", "POST /api/auth/device-link/generate - Unauthorized: no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("API", `POST /api/auth/device-link/generate - userId=${session.user.id}, email=${session.user.email}`)

    const token = crypto.randomUUID()
    const id = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await db.insert(deviceSession).values({
      id,
      userId: session.user.id,
      token,
      status: "pending",
      expiresAt,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const qrData = encodeDeviceLinkQrPayload({ type: "device-link", token, v: 1 })

    logger.info("API", `POST /api/auth/device-link/generate - token=${token.substring(0, 8)}..., expiresAt=${expiresAt.toISOString()}`)
    return NextResponse.json({ token, qrData, expiresAt })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/auth/device-link/generate - Error: ${msg}`)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
