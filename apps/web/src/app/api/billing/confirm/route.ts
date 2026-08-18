import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { getBillingUser } from "@/lib/billing-auth"
import { getDodo, tierFromProductId } from "@/lib/dodo"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getBillingUser(req)
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { subscriptionId } = await req.json() as { subscriptionId?: string }
    if (!subscriptionId) return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 })

    const subscription = await getDodo().subscriptions.retrieve(subscriptionId) as unknown as Record<string, unknown>
    const customerId = String(subscription.customer_id || "")
    if (customerId && currentUser.dodoCustomerId && customerId !== currentUser.dodoCustomerId) {
      return NextResponse.json({ error: "Subscription does not belong to this account" }, { status: 403 })
    }

    const productId = String(subscription.product_id || "")
    const tier = tierFromProductId(productId)
    await db.update(user).set({
      dodoCustomerId: customerId || currentUser.dodoCustomerId,
      dodoSubscriptionId: subscriptionId,
      subscriptionProductId: productId || null,
      subscriptionStatus: String(subscription.status || "active"),
      subscriptionRenewsAt: subscription.next_billing_date ? new Date(String(subscription.next_billing_date)) : null,
      subscriptionCancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      ...(tier ? { tier } : {}),
      updatedAt: new Date(),
    }).where(eq(user.id, currentUser.id))

    return NextResponse.json({ tier: tier || currentUser.tier, status: subscription.status })
  } catch (error) {
    console.error("Failed to confirm DoDo subscription", error)
    return NextResponse.json({ error: "Unable to confirm subscription" }, { status: 500 })
  }
}
