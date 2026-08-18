"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingSuccessPage() {
  const [message, setMessage] = useState(
    "Your checkout is complete. Your account will update shortly."
  )

  useEffect(() => {
    const nextSubscriptionId = new URLSearchParams(window.location.search).get("subscription_id")
    if (!nextSubscriptionId) return
    fetch("/api/billing/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: nextSubscriptionId }),
    }).then((response) => {
      setMessage(response.ok
        ? "Your subscription is active. Welcome to CrossCode."
        : "Your payment was received and your account will update shortly.")
    }).catch(() => setMessage("Your payment was received and your account will update shortly."))
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader><CardTitle>Subscription update</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p>{message}</p>
          <p className="text-sm text-muted-foreground">
            Indian UPI and card mandates may take up to 48 hours to settle on recurring payments. Access remains synchronized from confirmed DoDo payment webhooks.
          </p>
          <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
        </CardContent>
      </Card>
    </main>
  )
}
