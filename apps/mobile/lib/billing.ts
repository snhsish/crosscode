export async function createBillingCheckout(
  serverUrl: string,
  sessionToken: string,
  tier: "starter" | "builder",
  cycle: "monthly" | "yearly" = "monthly",
): Promise<string | null> {
  const response = await fetch(`${serverUrl}/api/billing/checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ tier, cycle }),
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.checkoutUrl ?? null
}

export async function createBillingPortal(serverUrl: string, sessionToken: string): Promise<string | null> {
  const response = await fetch(`${serverUrl}/api/billing/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.url ?? null
}
