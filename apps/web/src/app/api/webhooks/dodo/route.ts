import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { dodoWebhookEvent, user } from "@/lib/db/schema"
import { getDodo, tierFromProductId } from "@/lib/dodo"

type WebhookPayload = {
  type: string
  data?: Record<string, unknown>
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  try {
    const event = getDodo().webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": req.headers.get("webhook-id") || "",
        "webhook-signature": req.headers.get("webhook-signature") || "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
      },
    }) as unknown as WebhookPayload
    const webhookId = req.headers.get("webhook-id")
    if (!webhookId) return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 })

    try {
      await db.insert(dodoWebhookEvent).values({ id: webhookId, type: event.type })
    } catch {
      return NextResponse.json({ received: true })
    }

    const data = event.data || {}
    const metadata = (data.metadata || {}) as Record<string, unknown>
    const userId = typeof metadata.user_id === "string" ? metadata.user_id : null
    const customerId = typeof data.customer_id === "string" ? data.customer_id : null
    const customer = data.customer as { email?: unknown } | undefined
    const customerEmail = typeof customer?.email === "string" ? customer.email : null
    const subscriptionId = typeof data.subscription_id === "string" ? data.subscription_id : null
    const productId = typeof data.product_id === "string" ? data.product_id : null
    const tier = productId ? tierFromProductId(productId) : null

    const currentUser = userId
      ? await db.query.user.findFirst({ where: eq(user.id, userId) })
      : customerId
        ? await db.query.user.findFirst({ where: eq(user.dodoCustomerId, customerId) })
        : customerEmail
          ? await db.query.user.findFirst({ where: eq(user.email, customerEmail) })
          : null
    if (!currentUser) return NextResponse.json({ received: true })

    const status = event.type.startsWith("subscription.")
      ? event.type.replace("subscription.", "")
      : currentUser.subscriptionStatus
    const ended = ["cancelled", "expired"].includes(status || "")
    await db.update(user).set({
      dodoCustomerId: customerId || currentUser.dodoCustomerId,
      dodoSubscriptionId: subscriptionId || currentUser.dodoSubscriptionId,
      subscriptionProductId: productId || currentUser.subscriptionProductId,
      subscriptionStatus: status,
      subscriptionRenewsAt: data.next_billing_date ? new Date(String(data.next_billing_date)) : currentUser.subscriptionRenewsAt,
      subscriptionCancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
      tier: ended ? "free" : tier || currentUser.tier,
      updatedAt: new Date(),
    }).where(eq(user.id, currentUser.id))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("DoDo webhook verification or processing failed", error)
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
  }
}
