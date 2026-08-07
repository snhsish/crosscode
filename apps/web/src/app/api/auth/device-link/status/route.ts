import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      logger.warn("API", "GET /api/auth/device-link/status - Unauthorized: no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      logger.warn("API", "GET /api/auth/device-link/status - Bad request: no token")
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    logger.info("API", `GET /api/auth/device-link/status - userId=${session.user.id}, token=${token.substring(0, 8)}...`)

    const device = await db.query.deviceSession.findFirst({
      where: eq(deviceSession.token, token),
    })

    if (!device) {
      logger.warn("API", `GET /api/auth/device-link/status - Not found: token=${token.substring(0, 8)}...`)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (device.userId !== session.user.id) {
      logger.warn("API", `GET /api/auth/device-link/status - Forbidden: userId mismatch`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (new Date() > device.expiresAt) {
      logger.info("API", `GET /api/auth/device-link/status - Token expired: ${token.substring(0, 8)}...`)
      return NextResponse.json({ status: "expired" })
    }

    logger.info("API", `GET /api/auth/device-link/status - status=${device.status}, deviceName=${device.deviceName}`)
    return NextResponse.json({
      status: device.status,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `GET /api/auth/device-link/status - Error: ${msg}`)
    return NextResponse.json({ error: "Status check failed" }, { status: 500 })
  }
}
