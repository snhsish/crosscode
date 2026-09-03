import dns from "node:dns"
import postgres from "postgres"
import { logger } from "./logger.js"
import { effectiveTier } from "@crosscode/shared"

try {
  dns.setDefaultResultOrder("ipv4first")
} catch {}
const origLookup = dns.lookup
// @ts-ignore
dns.lookup = function patchedLookup(hostname: string, opts: unknown, cb: unknown) {
  const callback = (typeof opts === "function" ? opts : cb) as (err: unknown, addr: unknown, fam: unknown) => void
  const options = typeof opts === "object" && opts !== null ? (opts as Record<string, unknown>) : {}
  if (typeof hostname === "string" && hostname.includes("neon.tech")) {
    const ipv4Opts = { ...options, family: 4, all: true } as unknown as Parameters<typeof dns.lookup>[1]
    return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, ipv4Opts, (err: unknown, addrs: unknown) => {
      if (!err && Array.isArray(addrs) && addrs.length > 0) return callback(null, addrs, 4)
      return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, options as never, callback as never)
    })
  }
  return (origLookup as unknown as (h: string, o: unknown, c: unknown) => void)(hostname, opts as never, cb as never)
} as unknown as typeof dns.lookup

const rawUrl = process.env.DATABASE_URL || ""
const dbUrl = rawUrl.includes(".neon.tech") && !rawUrl.includes("-pooler")
  ? rawUrl.replace(/([a-z0-9-]+)\.c-/, "$1-pooler.c-").replace(/[?&]channel_binding=require/, "")
  : rawUrl.replace(/[?&]channel_binding=require/, "")

const sql = postgres(dbUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
  keep_alive: 60,
  connection: {
    statement_timeout: 30000,
  },
})

export async function validateApiKey(apiKey: string): Promise<{ userId: string; email: string; tier: string } | null> {
  logger.debug("Validating API key", { apiKey: apiKey.substring(0, 8) + "..." })
  let lastErr: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      lastErr = err
      const e = err as { code?: string; errors?: unknown[]; message?: string }
      const detail = `${e?.code || e?.message || String(err)}${e?.errors ? ` errors=[${(e.errors as { code?: string }[]).map((x) => x?.code).join(",")}]` : ""}`
      if (attempt < 3 && (detail.includes("ETIMEDOUT") || detail.includes("AggregateError"))) {
        logger.warn("API key validation retry", { attempt, detail })
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      logger.error("Database error during API key validation", { error: detail })
      throw err
    }
  }
  throw lastErr
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
