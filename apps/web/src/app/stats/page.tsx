import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { betaFeedback } from "@/lib/db/schema"

export const revalidate = 60

function avg(values: number[]) {
  if (values.length === 0) return null
  return Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1))
}

async function getStats() {
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
    return {
      submissions: feedbacks.length,
      avgOverall: avg(feedbacks.map((f) => f.ratingOverall)),
      avgUx: avg(feedbacks.map((f) => f.ratingUx)),
      avgPerf: avg(feedbacks.map((f) => f.ratingPerf)),
      bugs: feedbacks.filter((f) => f.bugs && f.bugs.trim() !== "").length,
      devices: new Set(feedbacks.map((f) => f.deviceModel)).size,
      testimonials: feedbacks
        .filter((f) => f.testimonialOptIn && f.testimonial && f.testimonial.trim() !== "")
        .slice(0, 6)
        .map((f) => ({ quote: f.testimonial as string, device: f.deviceModel })),
    }
  } catch {
    return {
      submissions: 0,
      avgOverall: null as number | null,
      avgUx: null as number | null,
      avgPerf: null as number | null,
      bugs: 0,
      devices: 0,
      testimonials: [] as { quote: string; device: string }[],
    }
  }
}

export default async function StatsPage() {
  const stats = await getStats()
  const cards = [
    { v: String(stats.submissions), l: "Responses" },
    { v: stats.avgOverall ? `${stats.avgOverall}★` : "-", l: "Avg overall" },
    { v: stats.avgUx ? `${stats.avgUx}★` : "-", l: "Avg ease of use" },
    { v: stats.avgPerf ? `${stats.avgPerf}★` : "-", l: "Avg performance" },
    { v: String(stats.bugs), l: "Bugs reported" },
    { v: String(stats.devices), l: "Devices covered" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Feedback Stats
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Live results from submitted feedback forms.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
            {cards.map((s) => (
              <Card key={s.l}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">{s.v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats.testimonials.length > 0 && (
            <div className="mx-auto mt-6 max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle>What testers say</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {stats.testimonials.map((t, i) => (
                    <blockquote key={i} className="rounded-lg border bg-muted/50 p-4 text-sm">
                      “{t.quote}”
                      <footer className="mt-2 text-xs text-muted-foreground">{t.device}</footer>
                    </blockquote>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
