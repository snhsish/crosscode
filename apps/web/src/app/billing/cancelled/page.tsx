import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BillingCancelledPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader><CardTitle>Checkout cancelled</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p>No payment was made. You can return to pricing whenever you are ready.</p>
          <Button asChild><Link href="/pricing">Return to pricing</Link></Button>
        </CardContent>
      </Card>
    </main>
  )
}
