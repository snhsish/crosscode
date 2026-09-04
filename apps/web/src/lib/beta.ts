export const BETA_FLOWS = [
  { id: "onboarding", label: "Onboarding / QR pair" },
  { id: "connect-cli", label: "Connect CLI tunnel" },
  { id: "chat-session", label: "Start / chat session" },
  { id: "diff-view", label: "Diff / code view" },
  { id: "background-reconnect", label: "Background / kill / reconnect" },
  { id: "billing-view", label: "Billing / paywall view" },
  { id: "offline-network", label: "Offline / low network" },
] as const

export const BUG_AREAS = [
  "Onboarding",
  "QR pairing",
  "CLI connect",
  "Chat session",
  "Diff view",
  "Background reconnect",
  "Billing",
  "Offline mode",
  "UI layout",
  "Performance",
  "Crash freeze",
  "Other",
] as const

export const BETA_APP_VERSION = "1.0.0-beta"
