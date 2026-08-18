import { NextRequest, NextResponse } from "next/server"
import { getBillingUser } from "@/lib/billing-auth"

export async function GET(req: NextRequest) {
  const currentUser = await getBillingUser(req)
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    tier: currentUser.tier,
    status: currentUser.subscriptionStatus,
    renewsAt: currentUser.subscriptionRenewsAt,
    cancelAtPeriodEnd: currentUser.subscriptionCancelAtPeriodEnd,
  })
}
