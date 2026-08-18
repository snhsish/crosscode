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
  starter: 1,
  builder: 5,
  enterprise: Number.POSITIVE_INFINITY,
}
