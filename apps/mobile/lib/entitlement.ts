import { useAuth } from "@/store/auth.store"

const PAID_TIERS = ["starter", "builder"]

export function isPaidTier(tier?: string | null) {
  return !!tier && PAID_TIERS.includes(tier)
}

export function useAllowsMultipleConnections() {
  const isLoggedIn = useAuth((s) => s.isLoggedIn)
  const tier = useAuth((s) => s.user?.tier)
  return isLoggedIn && isPaidTier(tier)
}
