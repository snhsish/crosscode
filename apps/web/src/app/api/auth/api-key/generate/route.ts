import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import crypto from "crypto"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = `cc_${crypto.randomBytes(24).toString("hex")}`

    await db.update(user)
      .set({ apiKey, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("API key generation error:", error)
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
