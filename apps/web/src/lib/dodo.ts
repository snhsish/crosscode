import DodoPayments from "dodopayments"

const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
  ? "test_mode"
  : "live_mode"

export function getDodo() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY
  if (!bearerToken) throw new Error("DODO_PAYMENTS_API_KEY is not configured")
  return new DodoPayments({
    bearerToken,
    environment,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  })
}

export function getProductId(tier: "starter" | "builder", cycle: "monthly" | "yearly") {
  const key = `DODO_PRODUCT_${tier.toUpperCase()}_${cycle.toUpperCase()}` as const
  const productId = process.env[key]
  if (!productId) throw new Error(`${key} is not configured`)
  return productId
}

export function tierFromProductId(productId: string): "starter" | "builder" | null {
  if (productId === process.env.DODO_PRODUCT_STARTER_MONTHLY || productId === process.env.DODO_PRODUCT_STARTER_YEARLY) return "starter"
  if (productId === process.env.DODO_PRODUCT_BUILDER_MONTHLY || productId === process.env.DODO_PRODUCT_BUILDER_YEARLY) return "builder"
  return null
}

export function appUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"}${path}`
}
