import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getBillingUser } from "@/lib/billing-auth"
import { appUrl, getDodo, getProductId } from "@/lib/dodo"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import type { BillingCurrency, BillingCycle, PaidTier } from "@crosscode/shared"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getBillingUser(req)
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json() as { tier?: string; cycle?: string; currency?: string }
    const tier = body.tier as PaidTier
    const cycle = body.cycle as BillingCycle
    const currency = body.currency as BillingCurrency | undefined
    if (!["starter", "builder"].includes(tier) || !["monthly", "yearly"].includes(cycle)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const dodo = getDodo()
    let customerId = currentUser.dodoCustomerId

    if (!customerId) {
      const created = await dodo.customers.create({
        email: currentUser.email,
        name: currentUser.name,
      })
      customerId = created.customer_id
      await db
        .update(user)
        .set({ dodoCustomerId: customerId, updatedAt: new Date() })
        .where(eq(user.id, currentUser.id))
    } else {
      try {
        await dodo.customers.update(customerId, { name: currentUser.name })
      } catch {
        // name sync is best-effort; checkout can still proceed with stored customer
      }
    }

    const productId = getProductId(tier, cycle)
    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { customer_id: customerId },
      allowed_payment_method_types: ["upi_collect", "credit", "debit"],
      ...(currency === "inr" ? { billing_currency: "INR" } : {}),
      return_url: appUrl("/billing/success"),
      cancel_url: appUrl("/billing/cancelled"),
      metadata: {
        user_id: currentUser.id,
        tier,
        cycle,
      },
      feature_flags: { redirect_immediately: true },
    })

    return NextResponse.json({ checkoutUrl: checkout.checkout_url, sessionId: checkout.session_id })
  } catch (error) {
    console.error("Failed to create DoDo checkout session", error)
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 })
  }
}
