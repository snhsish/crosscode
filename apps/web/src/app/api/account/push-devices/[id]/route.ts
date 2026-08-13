import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { pushDevice } from "@/lib/db/schema"
import { getAccountDevice } from "@/lib/account-device-auth"
import { logger } from "@/lib/logger"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const account = await getAccountDevice(req.headers.get("authorization"))
    if ("error" in account) {
      return NextResponse.json({ error: account.error }, { status: account.status })
    }

    const { id } = await params
    await db
      .update(pushDevice)
      .set({ enabled: false, updatedAt: new Date() })
      .where(and(eq(pushDevice.id, id), eq(pushDevice.userId, account.user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `DELETE /api/account/push-devices/[id] - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to disable push device" }, { status: 500 })
  }
}
