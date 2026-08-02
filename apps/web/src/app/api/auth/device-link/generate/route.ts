import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deviceSession } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { encodeDeviceLinkQrPayload } from "@crosscode/shared"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    return NextResponse.json({ token, qrData, expiresAt })
  } catch (error) {
    console.error("Device link generation error:", error)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
