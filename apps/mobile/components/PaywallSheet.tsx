import * as React from "react"
import { ActivityIndicator, Linking, Modal, Pressable, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "nativewind"
import Zap from "lucide-react-native/dist/esm/icons/zap"
import X from "lucide-react-native/dist/esm/icons/x"
import Check from "lucide-react-native/dist/esm/icons/check"
import { paidPlans, tierTunnelLimits, type BillingCycle, type PaidTier } from "@crosscode/shared"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { THEME } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useAuth } from "@/store/auth.store"
import { usePaywall } from "@/store/paywall.store"
import { createBillingCheckout } from "@/lib/billing"
import { getPaywallCopy, recordPaywallDismiss, refreshTier } from "@/lib/paywall"

const TIERS: PaidTier[] = ["starter", "builder"]

export function PaywallSheet() {
  const { colorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"
  const insets = useSafeAreaInsets()
  const visible = usePaywall((s) => s.visible)
  const trigger = usePaywall((s) => s.trigger)
  const user = useAuth((s) => s.user)
  const serverUrl = useAuth((s) => s.serverUrl)
  const sessionToken = useAuth((s) => s.sessionToken)
  const [cycle, setCycle] = React.useState<BillingCycle>("monthly")
  const [pendingTier, setPendingTier] = React.useState<PaidTier | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const copy = getPaywallCopy(trigger)
  const currentTier = user?.tier ?? "free"

  React.useEffect(() => {
    if (visible) {
      setError(null)
      setPendingTier(null)
    }
  }, [visible])

  const close = () => {
    void recordPaywallDismiss()
  }

  const openCheckout = async (tier: PaidTier) => {
    setError(null)
    if (!serverUrl || !sessionToken) {
      const fallback = serverUrl ?? "https://crosscode.site"
      try {
        await Linking.openURL(`${fallback}/pricing`)
      } catch {
        setError("Unable to open checkout. Visit crosscode.site/pricing.")
      }
      return
    }
    setPendingTier(tier)
    try {
      const url = await createBillingCheckout(serverUrl, sessionToken, tier, cycle)
      if (!url) throw new Error("checkout")
      await Linking.openURL(url)
      setTimeout(() => void refreshTier(), 5000)
    } catch {
      setError("Unable to start checkout. Try again.")
    } finally {
      setPendingTier(null)
    }
  }

  const openPricing = () => {
    const base = serverUrl ?? "https://crosscode.site"
    void Linking.openURL(`${base}/pricing`)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="absolute inset-0" onPress={close} />
        <View
          className="rounded-t-3xl border-t border-x border-border bg-card px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          <View className="items-center pb-2">
            <View className="h-1 w-10 rounded-full bg-muted" />
          </View>

          <View className="flex-row items-start justify-between gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Zap size={22} color={THEME[theme].primary} />
            </View>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close paywall"
              className="h-9 w-9 items-center justify-center rounded-full active:bg-muted"
            >
              <X size={18} color={THEME[theme].mutedForeground} />
            </Pressable>
          </View>

          <Text className="mt-3 text-xl font-semibold tracking-tight">{copy.title}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">{copy.description}</Text>

          <View className="mt-4 flex-row rounded-full bg-muted/50 p-1">
            {(["monthly", "yearly"] as BillingCycle[]).map((c) => {
              const selected = cycle === c
              return (
                <Pressable
                  key={c}
                  onPress={() => setCycle(c)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  className="flex-1 items-center rounded-full py-2"
                  style={{ backgroundColor: selected ? THEME[theme].card : "transparent" }}
                >
                  <Text
                    className="text-sm font-medium capitalize"
                    style={{ color: selected ? THEME[theme].foreground : THEME[theme].mutedForeground }}
                  >
                    {c === "yearly" ? "Yearly · save ~17%" : "Monthly"}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View className="mt-3 gap-2">
            {TIERS.map((tier) => {
              const plan = paidPlans[tier]
              const price = cycle === "monthly" ? plan.monthly.usd : plan.yearly.usd
              const per = cycle === "monthly" ? "/mo" : "/yr"
              const isCurrent = currentTier === tier
              const isPopular = tier === "builder"
              return (
                <View
                  key={tier}
                  className={cn(
                    "rounded-2xl border p-4",
                    isPopular ? "border-primary/60 bg-primary/5" : "border-border bg-muted/20"
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold">{plan.name}</Text>
                      {isPopular ? (
                        <View className="rounded-full bg-primary px-2 py-0.5">
                          <Text className="text-[11px] font-semibold text-primary-foreground">Most tunnels</Text>
                        </View>
                      ) : null}
                      {isCurrent ? (
                        <View className="rounded-full bg-muted px-2 py-0.5">
                          <Text className="text-[11px] font-medium text-muted-foreground">Current</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-base font-bold">
                      ${price}
                      <Text className="text-xs font-normal text-muted-foreground">{per}</Text>
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center gap-1.5">
                    <Check size={14} color={THEME[theme].primary} />
                    <Text className="text-sm text-muted-foreground">
                      {tierTunnelLimits[tier]} active tunnel{tierTunnelLimits[tier] === 1 ? "" : "s"} · everything in Free
                    </Text>
                  </View>
                  <Button
                    className="mt-3 h-11 rounded-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={isCurrent || pendingTier !== null}
                    onPress={() => openCheckout(tier)}
                  >
                    {pendingTier === tier ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text className={cn("text-sm font-semibold", !isPopular && "text-foreground")}>
                        {isCurrent ? `You're on ${plan.name}` : `Upgrade to ${plan.name}`}
                      </Text>
                    )}
                  </Button>
                </View>
              )
            })}
          </View>

          <Text className="mt-3 text-center text-xs text-muted-foreground">
            Free includes {tierTunnelLimits.free} tunnel · payments open securely in your browser
          </Text>

          {error ? (
            <Text className="mt-2 text-center text-xs text-destructive">{error}</Text>
          ) : null}

          <View className="mt-2 flex-row items-center justify-center gap-4">
            <Pressable onPress={close}>
              <Text className="text-sm font-medium text-muted-foreground">Not now</Text>
            </Pressable>
            <Pressable onPress={openPricing}>
              <Text className="text-sm font-medium text-primary">Compare plans</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
