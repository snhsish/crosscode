import { NextRequest, NextResponse } from "next/server"
import { count, eq } from "drizzle-orm"
import { getBillingUser } from "@/lib/billing-auth"
import { appUrl, getDodo, getFounderProductId, getProductId } from "@/lib/dodo"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { founderPlan, type BillingCurrency, type BillingCycle } from "@crosscode/shared"
import { checkRateLimit, rateLimitedResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const ipRl = await checkRateLimit(req, "billing")
    if (!ipRl.success) return rateLimitedResponse(ipRl)

    const currentUser = await getBillingUser(req)
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userRl = await checkRateLimit(req, "billing", `user:${currentUser.id}`)
    if (!userRl.success) return rateLimitedResponse(userRl)

    const body = await req.json() as { tier?: string; cycle?: string; currency?: string }
    const tier = body.tier
    const cycle = body.cycle as BillingCycle
    const currency = body.currency as BillingCurrency | undefined
    if (tier !== "pro" && tier !== "team" && tier !== "founder") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }
    if ((tier === "pro" || tier === "team") && !["monthly", "yearly"].includes(cycle)) {
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

    if (tier === "founder") {
      const soldRows = await db.select({ value: count() }).from(user).where(eq(user.tier, "founder"))
      const sold = soldRows[0]?.value ?? 0
      if (sold >= founderPlan.cap) {
        return NextResponse.json({ error: "Pro Lifetime is sold out" }, { status: 400 })
      }
      const productId = getFounderProductId()
      const checkout = await dodo.checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { customer_id: customerId },
        allowed_payment_method_types: ["upi_collect", "upi_intent", "credit", "debit"],
        ...(currency === "inr" ? { billing_currency: "INR", billing_address: { country: "IN" } } : {}),
        return_url: appUrl("/billing/success"),
        cancel_url: appUrl("/billing/cancelled"),
        metadata: {
          user_id: currentUser.id,
          tier: "founder",
        },
        feature_flags: { redirect_immediately: true },
      })
      return NextResponse.json({ checkoutUrl: checkout.checkout_url, sessionId: checkout.session_id })
    }

    const productId = getProductId(tier as "pro" | "team", cycle)
    const checkout = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { customer_id: customerId },
      allowed_payment_method_types: ["upi_collect", "upi_intent", "credit", "debit"],
      ...(currency === "inr" ? { billing_currency: "INR", billing_address: { country: "IN" } } : {}),
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
