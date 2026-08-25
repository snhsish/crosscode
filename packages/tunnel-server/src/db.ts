import postgres from "postgres"
import { logger } from "./logger.js"
import { effectiveTier } from "@crosscode/shared"

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  keep_alive: 60,
  connection: {
    statement_timeout: 30000,
  },
})

export async function validateApiKey(apiKey: string): Promise<{ userId: string; email: string; tier: string } | null> {
  logger.debug("Validating API key", { apiKey: apiKey.substring(0, 8) + "..." })
  try {
    const rows = await sql`
      SELECT id, email, tier, subscription_status
      FROM "user" WHERE api_key = ${apiKey} LIMIT 1
    `
    if (rows.length === 0) {
      logger.warn("API key not found in database", { apiKey: apiKey.substring(0, 8) + "..." })
      return null
    }
    const tier = effectiveTier(rows[0].tier, rows[0].subscription_status)
    logger.info("API key validated", { userId: rows[0].id, email: rows[0].email, tier })
    return { userId: rows[0].id, email: rows[0].email, tier }
  } catch (err) {
    logger.error("Database error during API key validation", { error: err instanceof Error ? err.message : String(err) })
    throw err
  }
}

export type PushEventKind = "completion" | "question" | "permission" | "error"

export async function getPushTargets(
  userId: string,
  kind: PushEventKind,
): Promise<Array<{ expoPushToken: string }>> {
  const settingColumn = {
    completion: sql`agent_response_completed`,
    question: sql`agent_question_interruption`,
    permission: sql`agent_permission_interruption`,
    error: sql`agent_error_interruption`,
  }[kind]

  const rows = await sql<Array<{ expo_push_token: string }>>`
    SELECT pd.expo_push_token
    FROM push_device pd
    LEFT JOIN account_notification_settings ans ON ans.user_id = pd.user_id
    WHERE pd.user_id = ${userId}
      AND pd.enabled = true
      AND COALESCE(${settingColumn}, true) = true
  `

  return rows.map((row) => ({ expoPushToken: row.expo_push_token }))
}

export async function sendExpoPush(
  userId: string,
  kind: PushEventKind,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  const targets = await getPushTargets(userId, kind)
  if (targets.length === 0) return

  const messages = targets.map((target) => ({
    to: target.expoPushToken,
    sound: "default",
    title,
    body,
    data,
  }))

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    })

    if (!res.ok) {
      logger.warn("Expo push send failed", { status: res.status, userId, kind })
    }
  } catch (err) {
    logger.warn("Expo push send error", {
      userId,
      kind,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
