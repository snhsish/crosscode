export type BillingCycle = "monthly" | "yearly"
export type BillingCurrency = "usd" | "inr"
export type PaidTier = "pro" | "team"

export const paidPlans = {
  pro: {
    name: "Pro",
    monthly: { usd: 3.99, inr: 299 },
    yearly: { usd: 29, inr: 2499 },
  },
  team: {
    name: "Team",
    monthly: { usd: 18, inr: 1499 },
    yearly: { usd: 179, inr: 14999 },
  },
} as const satisfies Record<PaidTier, {
  name: string
  monthly: { usd: number; inr: number }
  yearly: { usd: number; inr: number }
}>

export const founderPlan = {
  name: "Pro Lifetime",
  price: { usd: 50, inr: 2999 },
  cap: 100,
} as const

export const tierTunnelLimits: Record<string, number> = {
  free: 1,
  pro: 5,
  team: Number.POSITIVE_INFINITY,
  founder: 5,
  enterprise: Number.POSITIVE_INFINITY,
}

const PAID_TIERS = new Set(["pro", "team", "founder", "enterprise"])

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
    // Legacy normalization: starter/builder were replaced by pro.
    // Existing DB rows keep working without a data migration.
    if (tier === "starter" || tier === "builder") tier = "pro"
    // A one-time lifetime purchase has no subscription status to check —
    // it must never fall back to "free".
    if (tier === "founder") return "founder"
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

export type Entitlement =
  | "hosted_relay" | "unlimited_connections" | "file_browser" | "split_diff"
  | "global_search" | "session_export" | "approval_rules" | "usage_dashboard"
  | "extra_themes" | "custom_domain" | "fleet_view" | "audit_log" | "sso" | "priority_support"

export const entitlements: Record<Entitlement, "free" | "pro" | "team"> = {
  hosted_relay: "pro",
  unlimited_connections: "pro",
  file_browser: "pro",
  split_diff: "pro",
  global_search: "pro",
  session_export: "pro",
  approval_rules: "pro",
  usage_dashboard: "pro",
  extra_themes: "pro",
  custom_domain: "pro",
  fleet_view: "team",
  audit_log: "team",
  sso: "team",
  priority_support: "team",
}

export function tierRank(tier?: string | null): number {
  if (!tier) return 0
  // Legacy tiers resolve to pro-level.
  if (tier === "starter" || tier === "builder") return 1
  switch (tier) {
    case "free": return 0
    case "pro":
    case "founder": return 1
    case "team":
    case "enterprise": return 2
    default: return 0
  }
}

export function hasEntitlement(tier: string | null | undefined, e: Entitlement): boolean {
  // Legacy tiers resolve to pro-level everywhere.
  const normalized = tier === "starter" || tier === "builder" ? "pro" : tier
  return tierRank(normalized) >= tierRank(entitlements[e])
}
