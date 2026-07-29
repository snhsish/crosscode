import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    const users = await db.select().from(user).where(eq(user.apiKey, apiKey)).limit(1)

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const u = users[0]

    return NextResponse.json({
      email: u.email,
      name: u.name,
      tier: u.tier,
    })
  } catch (error) {
    console.error("API key validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
