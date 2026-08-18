import { NextRequest, NextResponse } from "next/server"
import { getBillingUser } from "@/lib/billing-auth"
import { appUrl, getDodo, getProductId } from "@/lib/dodo"
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

    const productId = getProductId(tier, cycle)
    const checkout = await getDodo().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: currentUser.dodoCustomerId
        ? { customer_id: currentUser.dodoCustomerId }
        : { email: currentUser.email, name: currentUser.name },
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
