import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    const body = await req.json()
    const { deviceName } = body

    const device = await db.query.deviceSession.findFirst({
      where: eq(deviceSession.token, token),
    })

    if (!device) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    }

    if (new Date() > device.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 })
    }

    if (device.status === "claimed") {
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

    return NextResponse.json({
      success: true,
      userId: device.userId,
      expiresAt: device.expiresAt,
    })
  } catch (error) {
    console.error("Device link claim error:", error)
    return NextResponse.json({ error: "Claim failed" }, { status: 500 })
  }
}
