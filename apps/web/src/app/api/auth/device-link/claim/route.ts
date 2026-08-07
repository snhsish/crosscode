import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      logger.warn("API", "POST /api/auth/device-link/claim - Bad request: no token")
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const body = await req.json()
    const { deviceName } = body

    logger.info("API", `POST /api/auth/device-link/claim - token=${token.substring(0, 8)}..., deviceName=${deviceName || "Unknown"}`)

    const device = await db.query.deviceSession.findFirst({
      where: eq(deviceSession.token, token),
    })

    if (!device) {
      logger.warn("API", `POST /api/auth/device-link/claim - Invalid token: ${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (new Date() > device.expiresAt) {
      logger.warn("API", `POST /api/auth/device-link/claim - Token expired: ${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }

    if (device.status === "claimed") {
      logger.warn("API", `POST /api/auth/device-link/claim - Token already claimed: ${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Token already claimed" }, { status: 410 })
    }

    await db
      .update(deviceSession)
      .set({
        status: "claimed",
        deviceName: deviceName || "Unknown Device",
        updatedAt: new Date(),
      })
      .where(eq(deviceSession.token, token))

    logger.info("API", `POST /api/auth/device-link/claim - Token claimed successfully: ${token.substring(0, 8)}..., userId=${device.userId}`)
    return NextResponse.json({
      success: true,
      userId: device.userId,
      expiresAt: device.expiresAt,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/auth/device-link/claim - Error: ${msg}`)
    return NextResponse.json({ error: "Claim failed" }, { status: 500 })
  }
}
