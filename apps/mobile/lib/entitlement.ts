import { hasEntitlement, type Entitlement } from "@crosscode/shared"
import { useAuth } from "@/store/auth.store"

export const PAID_TIERS = ["pro", "team", "founder", "enterprise"]

export function isPaidTier(tier?: string | null) {
  return !!tier && PAID_TIERS.includes(tier)
}

export function can(e: Entitlement, tier?: string | null): boolean {
  const t = tier ?? useAuth.getState().user?.tier ?? "free"
  return hasEntitlement(t, e)
}
