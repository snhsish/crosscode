import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { pushDevice } from "@/lib/db/schema"
import { getAccountDevice } from "@/lib/account-device-auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const account = await getAccountDevice(req.headers.get("authorization"))
    if ("error" in account) {
      return NextResponse.json({ error: account.error }, { status: account.status })
    }

    const body = await req.json()
    const expoPushToken = typeof body.expoPushToken === "string" ? body.expoPushToken : ""
    const platform = typeof body.platform === "string" ? body.platform : ""
    const deviceName = typeof body.deviceName === "string" ? body.deviceName : null

    if (!expoPushToken || !platform) {
      return NextResponse.json({ error: "expoPushToken and platform are required" }, { status: 400 })
    }

    const rows = await db
      .insert(pushDevice)
      .values({
        id: randomUUID(),
        userId: account.user.id,
        deviceSessionId: account.device.id,
        expoPushToken,
        platform,
        deviceName,
        enabled: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushDevice.expoPushToken,
        set: {
          userId: account.user.id,
          deviceSessionId: account.device.id,
          platform,
          deviceName,
          enabled: true,
          updatedAt: new Date(),
        },
      })
      .returning()

    return NextResponse.json({ device: rows[0] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/account/push-devices - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to register push device" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const account = await getAccountDevice(req.headers.get("authorization"))
    if ("error" in account) {
      return NextResponse.json({ error: account.error }, { status: account.status })
    }

    const devices = await db.query.pushDevice.findMany({
      where: eq(pushDevice.userId, account.user.id),
    })

    return NextResponse.json({
      devices: devices.map((device) => ({
        id: device.id,
        platform: device.platform,
        deviceName: device.deviceName,
        enabled: device.enabled,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `GET /api/account/push-devices - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to fetch push devices" }, { status: 500 })
  }
}
