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

// Dodo subscription statuses that still grant paid access. "active" is the
// steady state; "trialing" covers trials. A subscription cancelled with
// cancel_at_period_end=true stays "active" until the period ends, but treat
// an explicit grace window as paid too so webhook timing can't downgrade
// a user who still has access (issue #129).
const ACTIVE_STATUSES = new Set(["active", "trialing", "trial", "past_due"])

// Every status Dodo actually reports. Anything else in this column is a
// leftover from the old webhook, which stored the event name suffix
// ("updated", "created", ...) as the status.
const KNOWN_STATUSES = new Set([
    "active", "trialing", "trial", "past_due", "cancelled", "canceled",
    "expired", "terminated", "failed", "on_hold", "paused",
    "incomplete", "incomplete_expired", "unpaid",
])

export type EffectiveTierOpts = {
    cancelAtPeriodEnd?: boolean | null
    renewsAt?: Date | string | null
}

/**
 * A paid tier only counts as paid while its subscription grants access.
 * Otherwise it falls back to "free". Mirrors the tunnel-server SQL logic
 * so the tier shown in the CLI matches what the tunnel server enforces.
 */
export function effectiveTier(
    tier: string | null | undefined,
    subscriptionStatus: string | null | undefined,
    opts?: EffectiveTierOpts,
): string {
    if (!tier) return "free"
    if (!PAID_TIERS.has(tier)) return tier
    const status = (subscriptionStatus ?? "").toLowerCase()
    if (ACTIVE_STATUSES.has(status)) return tier
    // Grace period: cancelled at period end but the current period hasn't
    // elapsed yet (dashboard still shows the paid plan until renewal date).
    const renews = opts?.renewsAt ? new Date(opts.renewsAt).getTime() : NaN
    const renewsInFuture = !Number.isNaN(renews) && renews > Date.now()
    if (opts?.cancelAtPeriodEnd && (Number.isNaN(renews) || renewsInFuture)) return tier
    // Self-heal rows corrupted by the old webhook (event suffix stored as
    // status): an unrecognized status with a future renewal date belongs to
    // a subscription Dodo still considers billable, so keep the paid tier
    // until a real status arrives.
    if (status && !KNOWN_STATUSES.has(status) && renewsInFuture) return tier
    return "free"
}
