export type BillingCycle = "monthly" | "yearly"
export type BillingCurrency = "usd" | "inr"
export type PaidTier = "starter" | "builder"

export const paidPlans = {
  starter: {
    name: "Starter",
    monthly: { usd: 2, inr: 175 },
    yearly: { usd: 20, inr: 1899 },
  },
  builder: {
    name: "Builder",
    monthly: { usd: 5, inr: 475 },
    yearly: { usd: 50, inr: 4799 },
  },
} as const satisfies Record<PaidTier, {
  name: string
  monthly: { usd: number; inr: number }
  yearly: { usd: number; inr: number }
}>

export const tierTunnelLimits: Record<string, number> = {
  free: 1,
  starter: 2,
  builder: 5,
  enterprise: Number.POSITIVE_INFINITY,
}

const PAID_TIERS = new Set(["starter", "builder", "enterprise"])

/**
 * A paid tier only counts as paid while its subscription is active.
 * Otherwise it falls back to "free". Mirrors the tunnel-server SQL logic
 * so the tier shown in the CLI matches what the tunnel server enforces.
 */
export function effectiveTier(tier: string | null | undefined, subscriptionStatus: string | null | undefined): string {
  if (!tier) return "free"
  if (PAID_TIERS.has(tier) && (subscriptionStatus ?? "") !== "active") return "free"
  return tier
}
