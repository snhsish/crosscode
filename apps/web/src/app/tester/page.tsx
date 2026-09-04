import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BETA_APP_VERSION } from "@/lib/beta"
import { Check, X } from "lucide-react"
import Link from "next/link"

const SETUP = [
  "Real Android device (not an emulator)",
  `Beta build ${BETA_APP_VERSION} installed from the Expo link we sent you`,
  "PC with the CLI running (npx crosscode)",
  "Internet on both phone and PC (any network works)",
] as const

const STEPS = [
  {
    title: "Install the beta build",
    body: "Install from the closed track link we sent you. Open Settings or About in the app and confirm the version matches the build above.",
  },
  {
    title: "Pair with your PC",
    body: "Start the CLI on your PC, open the app, and scan the QR code. Confirm the connection succeeds and the session list loads.",
  },
  {
    title: "Run a chat session",
    body: "Start a session and send several prompts. Check replies stream in, history persists when you leave and return, and long outputs render fully.",
  },
  {
    title: "Review code and diffs",
    body: "Ask for a code change and open the diff view. Check it is readable, scrolls well, and matches the chat content.",
  },
  {
    title: "Background, kill, reconnect",
    body: "Background the app mid session, then force kill and reopen it. Confirm the session resumes or reconnects without data loss.",
  },
  {
    title: "Test the paywall",
    body: "Open the paywall and apply the 100% coupon code from the DM to complete the flow end to end. If you cannot (no card or other issue), just confirm plans and prices render correctly and move on.",
  },
  {
    title: "Go offline and slow",
    body: "Turn on airplane mode, then try a weak connection. Confirm clear error states appear and the app recovers when the network returns.",
  },
] as const

const SKIP = [
  "Do not spend real money. Only use the coupon code from the DM.",
  "Do not test iOS builds. This round is Android only.",
  "Do not rely on an emulator. Use a real device as your main run.",
  "Do not test old versions. Only the build listed above counts.",
] as const

export default function TesterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Tester Guide
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything to test before launch, step by step.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Before you start</CardTitle>
                <CardDescription>You need all four ready.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {SETUP.map((s) => (
                    <li key={s} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test steps</CardTitle>
                <CardDescription>Go in order. Note anything odd as you go.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {STEPS.map((step, i) => (
                  <div key={step.title} className="flex gap-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Do not test</CardTitle>
                <CardDescription>Out of scope for this round.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {SKIP.map((s) => (
                    <li key={s} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <X className="h-3 w-3 text-destructive" />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle>Final step</CardTitle>
                <CardDescription>Done with every step above? Send your review.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link href="/tester/feedback">Submit Beta Review Feedback</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
