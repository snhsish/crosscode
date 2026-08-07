import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession, user } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("API", "GET /api/account - Unauthorized: no Bearer token")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    logger.info("API", `GET /api/account - token=${token.substring(0, 8)}...`)

    const device = await db.query.deviceSession.findFirst({
      where: and(
        eq(deviceSession.token, token),
        eq(deviceSession.status, "claimed")
      ),
    })

    if (!device) {
      logger.warn("API", `GET /api/account - Invalid or unclaimed token: ${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Invalid or unclaimed token" }, { status: 401 })
    }

    if (new Date() > device.expiresAt) {
      logger.warn("API", `GET /api/account - Token expired: ${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }

    const userData = await db.query.user.findFirst({
      where: eq(user.id, device.userId),
    })

    if (!userData) {
      logger.error("API", `GET /api/account - User not found: userId=${device.userId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const devices = await db.query.deviceSession.findMany({
      where: eq(deviceSession.userId, device.userId),
    })

    logger.info("API", `GET /api/account - Success: email=${userData.email}, devices=${devices.length}`)
    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        tier: userData.tier,
      },
      devices: devices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        status: d.status,
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `GET /api/account - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}
