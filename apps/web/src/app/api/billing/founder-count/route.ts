import { NextRequest, NextResponse } from "next/server"
import { count, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { founderPlan } from "@crosscode/shared"
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit"

export async function GET(req: NextRequest) {
  const rl = await checkRateLimit(req, "publicRead")
  if (!rl.success) return rateLimitedResponse(rl)

  const rows = await db.select({ value: count() }).from(user).where(eq(user.tier, "founder"))
  const sold = rows[0]?.value ?? 0
  return NextResponse.json({
    count: sold,
    cap: founderPlan.cap,
    remaining: Math.max(0, founderPlan.cap - sold),
  })
}
