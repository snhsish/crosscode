import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const device = await db.query.deviceSession.findFirst({
      where: eq(deviceSession.token, token),
    })

    if (!device) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (device.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (new Date() > device.expiresAt) {
      return NextResponse.json({ status: "expired" })
    }

    return NextResponse.json({
      status: device.status,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
    })
  } catch (error) {
    console.error("Device link status error:", error)
    return NextResponse.json({ error: "Status check failed" }, { status: 500 })
  }
}
