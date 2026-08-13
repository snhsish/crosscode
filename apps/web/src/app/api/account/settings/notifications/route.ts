import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { accountNotificationSettings } from "@/lib/db/schema"
import { getAccountDevice } from "@/lib/account-device-auth"
import { logger } from "@/lib/logger"

const defaults = {
  agentResponseCompleted: true,
  agentQuestionInterruption: true,
  agentPermissionInterruption: true,
  agentErrorInterruption: true,
}

function toResponse(settings: typeof accountNotificationSettings.$inferSelect | null) {
  return {
    agentResponseCompleted: settings?.agentResponseCompleted ?? defaults.agentResponseCompleted,
    agentQuestionInterruption: settings?.agentQuestionInterruption ?? defaults.agentQuestionInterruption,
    agentPermissionInterruption: settings?.agentPermissionInterruption ?? defaults.agentPermissionInterruption,
    agentErrorInterruption: settings?.agentErrorInterruption ?? defaults.agentErrorInterruption,
  }
}

export async function GET(req: NextRequest) {
  try {
    const account = await getAccountDevice(req.headers.get("authorization"))
    if ("error" in account) {
      return NextResponse.json({ error: account.error }, { status: account.status })
    }

    const settings = await db.query.accountNotificationSettings.findFirst({
      where: eq(accountNotificationSettings.userId, account.user.id),
    })

    return NextResponse.json(toResponse(settings ?? null))
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `GET /api/account/settings/notifications - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const account = await getAccountDevice(req.headers.get("authorization"))
    if ("error" in account) {
      return NextResponse.json({ error: account.error }, { status: account.status })
    }

    const body = await req.json()
    const next = {
      agentResponseCompleted:
        typeof body.agentResponseCompleted === "boolean"
          ? body.agentResponseCompleted
          : defaults.agentResponseCompleted,
      agentQuestionInterruption:
        typeof body.agentQuestionInterruption === "boolean"
          ? body.agentQuestionInterruption
          : defaults.agentQuestionInterruption,
      agentPermissionInterruption:
        typeof body.agentPermissionInterruption === "boolean"
          ? body.agentPermissionInterruption
          : defaults.agentPermissionInterruption,
      agentErrorInterruption:
        typeof body.agentErrorInterruption === "boolean"
          ? body.agentErrorInterruption
          : defaults.agentErrorInterruption,
      updatedAt: new Date(),
    }

    const rows = await db
      .insert(accountNotificationSettings)
      .values({
        userId: account.user.id,
        ...next,
      })
      .onConflictDoUpdate({
        target: accountNotificationSettings.userId,
        set: next,
      })
      .returning()

    return NextResponse.json(toResponse(rows[0] ?? null))
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `PUT /api/account/settings/notifications - Error: ${msg}`)
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 })
  }
}
