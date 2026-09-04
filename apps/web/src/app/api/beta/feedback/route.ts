import { db } from "@/lib/db"
import { betaFeedback, betaTester } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import crypto from "crypto"
import { logger } from "@/lib/logger"

const FLOWS = [
  "onboarding",
  "connect-cli",
  "chat-session",
  "diff-view",
  "background-reconnect",
  "billing-view",
  "offline-network",
]

function clampRating(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.min(5, Math.max(1, Math.round(n)))
}

function normalizeBugs(v: unknown) {
  if (Array.isArray(v)) {
    const text = v
      .map((b) => {
        if (typeof b === "string") return b.trim()
        if (typeof b === "object" && b !== null) {
          const area = String((b as Record<string, unknown>).area ?? "").slice(0, 50)
          const desc = String((b as Record<string, unknown>).desc ?? (b as Record<string, unknown>).description ?? "").trim()
          if (!area && !desc) return ""
          return `[${area || "Other"}] ${desc}`.trim()
        }
        return ""
      })
      .filter(Boolean)
      .join("\n\n")
    return text.slice(0, 5000) || null
  }
  return String(v ?? "").slice(0, 5000) || null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body?.email?.trim().toLowerCase()
    const appVersion = body?.appVersion?.trim().slice(0, 50)
    const deviceModel = body?.deviceModel?.trim().slice(0, 100)
    const androidVersion = body?.androidVersion?.trim().slice(0, 50)
    const pcOs = body?.pcOs?.trim().slice(0, 100)
    const flowsTested: string[] = Array.isArray(body?.flowsTested)
      ? body.flowsTested.filter((f: unknown) => FLOWS.includes(String(f)))
      : []
    const ratingOverall = clampRating(body?.ratingOverall)
    const ratingUx = clampRating(body?.ratingUx)
    const ratingPerf = clampRating(body?.ratingPerf)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    if (!appVersion || !deviceModel || !androidVersion) {
      return NextResponse.json({ error: "Device and app version are required" }, { status: 400 })
    }
    if (!pcOs) {
      return NextResponse.json({ error: "PC operating system is required" }, { status: 400 })
    }
    if (flowsTested.length === 0) {
      return NextResponse.json({ error: "Select at least one flow you tested" }, { status: 400 })
    }
    if (!ratingOverall || !ratingUx || !ratingPerf) {
      return NextResponse.json({ error: "Ratings 1-5 are required" }, { status: 400 })
    }

    const testers = await db
      .select({ id: betaTester.id })
      .from(betaTester)
      .where(eq(betaTester.email, email))
      .limit(1)

    let testerId: string | null = testers[0]?.id ?? null
    if (!testerId) {
      testerId = crypto.randomUUID()
      await db.insert(betaTester).values({ id: testerId, email, deviceModel, androidVersion, status: "submitted" })
    } else {
      await db.update(betaTester).set({ status: "submitted", deviceModel, androidVersion }).where(eq(betaTester.id, testerId))
    }

    await db.insert(betaFeedback).values({
      id: crypto.randomUUID(),
      testerId,
      email,
      appVersion,
      deviceModel,
      androidVersion,
      pcOs,
      flowsTested: JSON.stringify(flowsTested),
      ratingOverall,
      ratingUx,
      ratingPerf,
      bugs: normalizeBugs(body?.bugs),
      fav: String(body?.fav ?? "").slice(0, 2000) || null,
      missing: String(body?.missing ?? "").slice(0, 2000) || null,
      keepUsing: ["yes", "maybe", "no"].includes(body?.keepUsing) ? body.keepUsing : null,
      projectName: String(body?.projectName ?? "").slice(0, 100) || null,
      projectDesc: String(body?.projectDesc ?? "").slice(0, 2000) || null,
      projectLink: String(body?.projectLink ?? "").slice(0, 500) || null,
      testimonial: String(body?.testimonial ?? "").slice(0, 2000) || null,
      testimonialOptIn: Boolean(body?.testimonialOptIn),
    })

    logger.info("API", `POST /api/beta/feedback - ${email}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `POST /api/beta/feedback - Error: ${msg}`)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
