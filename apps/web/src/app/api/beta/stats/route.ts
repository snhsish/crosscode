import { db } from "@/lib/db"
import { betaFeedback } from "@/lib/db/schema"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export const revalidate = 60

function avg(values: number[]) {
  if (values.length === 0) return null
  return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1))
}

export async function GET() {
  try {
    const feedbacks = await db
      .select({
        ratingOverall: betaFeedback.ratingOverall,
        ratingUx: betaFeedback.ratingUx,
        ratingPerf: betaFeedback.ratingPerf,
        bugs: betaFeedback.bugs,
        deviceModel: betaFeedback.deviceModel,
        testimonial: betaFeedback.testimonial,
        testimonialOptIn: betaFeedback.testimonialOptIn,
      })
      .from(betaFeedback)
      .limit(500)

    const submissions = feedbacks.length
    const bugs = feedbacks.filter((f) => f.bugs && f.bugs.trim() !== "").length
    const devices = new Set(feedbacks.map((f) => f.deviceModel)).size
    const testimonials = feedbacks
      .filter((f) => f.testimonialOptIn && f.testimonial && f.testimonial.trim() !== "")
      .slice(0, 6)
      .map((t) => ({ quote: t.testimonial, device: t.deviceModel }))

    return NextResponse.json({
      submissions,
      avgOverall: avg(feedbacks.map((f) => f.ratingOverall)),
      avgUx: avg(feedbacks.map((f) => f.ratingUx)),
      avgPerf: avg(feedbacks.map((f) => f.ratingPerf)),
      bugs,
      devices,
      testimonials,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error("API", `GET /api/beta/stats - Error: ${msg}`)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
