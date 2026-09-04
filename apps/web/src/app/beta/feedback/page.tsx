import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedbackForm } from "@/components/beta/feedback-form"
import { Suspense } from "react"

export default function BetaFeedbackPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Beta Review Feedback</CardTitle>
                <CardDescription>
                  Share what you tested, what worked, and what broke. Fill every section that applies to your run.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense>
                  <FeedbackForm />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
