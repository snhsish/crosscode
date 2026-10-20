import AsyncStorage from "@react-native-async-storage/async-storage"
import { tierTunnelLimits, type Entitlement } from "@crosscode/shared"
import { useAuth } from "@/store/auth.store"
import { usePaywall } from "@/store/paywall.store"
import { can } from "@/lib/entitlement"

export type PaywallTrigger =
  | "connection_limit"
  | "tunnel_limit"
  | "usage_nudge"
  | "session_nudge"
  | "onboarding"
  | "manual"
  | "file_browser"
  | "saved_connections_cap"
  | "approval_rules"
  | "stable_url"
  | "global_search"

export type PaywallCopy = {
  title: string
  description: string
}

const HARD_TRIGGERS: PaywallTrigger[] = [
  "connection_limit",
  "tunnel_limit",
  "manual",
  "file_browser",
  "saved_connections_cap",
]

const TRIGGER_ENTITLEMENT: Partial<Record<PaywallTrigger, Entitlement>> = {
  file_browser: "file_browser",
  saved_connections_cap: "unlimited_connections",
  connection_limit: "unlimited_connections",
  approval_rules: "approval_rules",
  stable_url: "hosted_relay",
  global_search: "global_search",
}

const SHOWS_KEY = "crosscode-paywall-shows"
const DISMISS_KEY = "crosscode-paywall-dismisses"
const MAX_PER_DAY = 2
const MAX_PER_WEEK = 5
const BACKOFF_AFTER_DISMISSES = 3
const BACKOFF_MS = 3 * 24 * 60 * 60 * 1000

async function readStamps(key: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : []
  } catch {
    return []
  }
}

async function pushStamp(key: string, now: number) {
  const stamps = await readStamps(key)
  const pruned = stamps.filter((t) => now - t < 7 * 24 * 60 * 60 * 1000).slice(-20)
  pruned.push(now)
  try {
    await AsyncStorage.setItem(key, JSON.stringify(pruned))
  } catch {}
}

export function tunnelLimitForTier(tier?: string | null): number {
  return tierTunnelLimits[tier ?? "free"] ?? tierTunnelLimits.free
}

export function isAtTunnelLimit(tier: string | undefined | null, count: number): boolean {
  return count >= tunnelLimitForTier(tier ?? "free")
}

export function getPaywallCopy(trigger: PaywallTrigger): PaywallCopy {
  switch (trigger) {
    case "connection_limit":
      return {
        title: "You've hit your connection limit",
        description: "Free includes 1 tunnel. Upgrade to Pro to run more projects in parallel.",
      }
    case "saved_connections_cap":
      return {
        title: "Run every machine you own",
        description: "Pro unlocks unlimited saved connections. Every machine, one phone.",
      }
    case "tunnel_limit":
      return {
        title: "Tunnel limit reached",
        description: "Your plan is at capacity. Upgrade to Pro for 5 active tunnels.",
      }
    case "file_browser":
      return {
        title: "Browse the whole repo from your phone",
        description: "The file browser and viewer are Pro. Explore any repo, anywhere.",
      }
    case "approval_rules":
      return {
        title: "Let safe commands run themselves",
        description: "Pro approval rules auto-approve the safe stuff and ping you for the rest.",
      }
    case "stable_url":
      return {
        title: "Stop re-scanning the QR",
        description: "Pro's hosted relay gives you a stable URL. Connect once, stay connected.",
      }
    case "global_search":
      return {
        title: "Find that fix from last week",
        description: "Pro searches across every session at once, so you never lose work.",
      }
    case "session_nudge":
      return {
        title: "Power through more sessions",
        description: "Keep every project live at once with Pro's extra tunnels.",
      }
    case "onboarding":
      return {
        title: "Do more with CrossCode",
        description: "Start free with 1 tunnel, upgrade to Pro whenever you need more.",
      }
    case "usage_nudge":
      return {
        title: "Running out of room?",
        description: "You're using your full tunnel quota. Upgrade to Pro to add another project.",
      }
    default:
      return {
        title: "Upgrade to Pro",
        description: "Hosted relay, 5 tunnels, and power features for your agent.",
      }
  }
}

export async function shouldShowPaywall(trigger: PaywallTrigger): Promise<boolean> {
  if (HARD_TRIGGERS.includes(trigger)) return true
  const now = Date.now()
  const [shows, dismisses] = await Promise.all([readStamps(SHOWS_KEY), readStamps(DISMISS_KEY)])
  const dayAgo = shows.filter((t) => now - t < 24 * 60 * 60 * 1000)
  const weekAgo = shows.filter((t) => now - t < 7 * 24 * 60 * 60 * 1000)
  if (dayAgo.length >= MAX_PER_DAY || weekAgo.length >= MAX_PER_WEEK) return false
  if (dismisses.length >= BACKOFF_AFTER_DISMISSES) {
    const lastDismiss = dismisses[dismisses.length - 1]
    if (now - lastDismiss < BACKOFF_MS) return false
  }
  return true
}

export async function requestPaywall(trigger: PaywallTrigger, opts?: { force?: boolean }): Promise<boolean> {
  const tier = useAuth.getState().user?.tier ?? "free"
  const needed = TRIGGER_ENTITLEMENT[trigger]
  if (needed && can(needed, tier)) return false
  if (!needed && (tier === "pro" || tier === "founder" || tier === "team" || tier === "enterprise")) {
    // Legacy catch-all: users with Pro-level+ never see generic nudges.
    if (trigger === "usage_nudge" || trigger === "session_nudge" || trigger === "onboarding") return false
  }
  if (!opts?.force && !(await shouldShowPaywall(trigger))) return false
  await pushStamp(SHOWS_KEY, Date.now())
  usePaywall.getState().show(trigger)
  return true
}

export async function recordPaywallDismiss() {
  await pushStamp(DISMISS_KEY, Date.now())
  usePaywall.getState().hide()
}

export async function refreshTier(): Promise<string | null> {
  const { serverUrl, sessionToken, user, setUser } = useAuth.getState()
  if (!serverUrl || !sessionToken || !user) return null
  try {
    const res = await fetch(`${serverUrl}/api/account`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const tier = data?.user?.tier as string | undefined
    if (tier && tier !== user.tier) setUser({ ...user, tier })
    return tier ?? null
  } catch {
    return null
  }
}
