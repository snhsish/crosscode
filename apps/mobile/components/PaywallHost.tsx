import * as React from "react"
import { AppState } from "react-native"
import { PaywallSheet } from "@/components/PaywallSheet"
import { refreshTier } from "@/lib/paywall"

export function PaywallHost() {
  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshTier()
    })
    return () => sub.remove()
  }, [])

  return <PaywallSheet />
}
