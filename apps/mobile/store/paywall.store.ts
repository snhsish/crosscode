import { create } from "zustand"
import type { PaywallTrigger } from "@/lib/paywall"

type PaywallStore = {
  visible: boolean
  trigger: PaywallTrigger
  show: (trigger?: PaywallTrigger) => void
  hide: () => void
}

export const usePaywall = create<PaywallStore>()((set) => ({
  visible: false,
  trigger: "manual",
  show: (trigger = "manual") => set({ visible: true, trigger }),
  hide: () => set({ visible: false }),
}))
