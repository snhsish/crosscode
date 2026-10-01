import { NextRequest, NextResponse } from "next/server"
import { getBillingUser } from "@/lib/billing-auth"
import { effectiveTier } from "@crosscode/shared"

export async function GET(req: NextRequest) {
  const currentUser = await getBillingUser(req)
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    tier: effectiveTier(currentUser.tier, currentUser.subscriptionStatus, {
      cancelAtPeriodEnd: currentUser.subscriptionCancelAtPeriodEnd,
      renewsAt: currentUser.subscriptionRenewsAt,
    }),
    status: currentUser.subscriptionStatus,
    renewsAt: currentUser.subscriptionRenewsAt,
    cancelAtPeriodEnd: currentUser.subscriptionCancelAtPeriodEnd,
  })
}
