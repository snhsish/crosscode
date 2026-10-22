"use client";

import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { founderPlan, paidPlans, type BillingCurrency, type BillingCycle, type PaidTier } from "@crosscode/shared";

function detectCurrency(): BillingCurrency {
  if (typeof window === "undefined") return "usd";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return timezone.includes("Kolkata") || timezone.includes("Calcutta") ? "inr" : "usd";
}

const subscribeCurrency = () => () => {};

function useDetectedCurrency(): BillingCurrency {
  return useSyncExternalStore(
    subscribeCurrency,
    detectCurrency,
    () => "usd" as BillingCurrency
  );
}

const tiers = [
  {
    name: "Free",
    tier: null,
    description: "Your agent, in your pocket.",
    features: [
      { label: "QR connect, chat, streaming, markdown/code blocks", included: true },
      { label: "Approvals, inline diffs, git graph, session sharing", included: true },
      { label: "Voice input, push notifications, quick prompts", included: true },
      { label: "1 active tunnel (bring-your-own cloudflared/ngrok)", included: true },
      { label: "Light/dark themes, biometric lock, up to 2 saved servers", included: true },
      { label: "Hosted CrossCode relay (stable URL)", included: false },
      { label: "File browser, side-by-side diff, global search", included: false },
      { label: "Session export, approval rules, usage dashboard", included: false },
    ],
    cta: "Get Started",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Pro",
    tier: "pro" as PaidTier,
    description: "Your agent, always reachable and under your control.",
    features: [
      { label: "Everything in Free", included: true },
      { label: "Hosted CrossCode relay (stable URL, low latency)", included: true },
      { label: "5 active tunnels", included: true },
      { label: "File-tree browser + file viewer", included: true },
      { label: "Side-by-side diff, global search, session export", included: true },
      { label: "Approval rules / auto-approve policies", included: true },
      { label: "Token/cost dashboard, unlimited saved connections", included: true },
      { label: "Extra themes, custom domain", included: true },
      { label: "Unlimited fair-use traffic", included: true, href: "/legal/fair-usage" },
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/login",
    highlighted: true,
  },
];

function discountPercent(tier: PaidTier, currency: "usd" | "inr") {
  const plan = paidPlans[tier];
  return Math.round((1 - plan.yearly[currency] / (plan.monthly[currency] * 12)) * 100);
}

const comparisonFeatures = [
  {
    category: "Core (always free)",
    rows: [
      { label: "Chat, streaming, approvals, diffs, git", values: ["Yes", "Yes"] },
      { label: "Voice input, push notifications, biometric lock", values: ["Yes", "Yes"] },
      { label: "Light/dark themes, up to 2 saved servers", values: ["Yes", "Yes"] },
    ],
  },
  {
    category: "Relay & Tunnels",
    rows: [
      { label: "Tunnel", values: ["Bring-your-own (cloudflared/ngrok)", "Hosted relay + BYO"] },
      { label: "Active tunnels", values: ["1", "5"] },
      { label: "Stable URL", values: ["No", "Yes"] },
      { label: "Traffic", values: ["Fair use", "Unlimited fair use"] },
    ],
  },
  {
    category: "Power features",
    rows: [
      { label: "File browser + viewer", values: ["No", "Yes"] },
      { label: "Side-by-side diff", values: ["No", "Yes"] },
      { label: "Global search across sessions", values: ["No", "Yes"] },
      { label: "Session export (Markdown/JSON)", values: ["No", "Yes"] },
      { label: "Approval rules / auto-approve", values: ["No", "Yes"] },
      { label: "Token/cost dashboard", values: ["No", "Yes"] },
      { label: "Unlimited saved connections", values: ["No", "Yes"] },
      { label: "Extra themes, custom domain", values: ["No", "Yes"] },
    ],
  },
  {
    category: "Support",
    rows: [
      { label: "Support", values: ["Community", "Email"] },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [currency, setCurrency] = useState<BillingCurrency | null>(null);
  const detectedCurrency = useDetectedCurrency();
  const effectiveCurrency = currency ?? detectedCurrency;
  const [checkoutTier, setCheckoutTier] = useState<string | null>(null);
  const [founderCount, setFounderCount] = useState<{ count: number; cap: number; remaining: number } | null>(null);

  useEffect(() => {
    fetch("/api/billing/founder-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.count === "number") setFounderCount(d);
      })
      .catch(() => {});
  }, []);

  const startCheckout = useCallback(async (tier: PaidTier, selectedCycle: BillingCycle = cycle, selectedCurrency: BillingCurrency = effectiveCurrency) => {
    setCheckoutTier(tier);
    try {
      const { data } = await authClient.getSession();
      if (!data?.session) {
        router.push(`/login?next=${encodeURIComponent(`/pricing?plan=${tier}&cycle=${selectedCycle}&currency=${selectedCurrency}`)}`);
        return;
      }
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, cycle: selectedCycle, currency: selectedCurrency }),
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Checkout failed");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      console.error("Unable to start checkout", error);
      setCheckoutTier(null);
    }
  }, [cycle, effectiveCurrency, router]);

  const startFounderCheckout = useCallback(async () => {
    setCheckoutTier("founder");
    try {
      const { data } = await authClient.getSession();
      if (!data?.session) {
        router.push(`/login?next=${encodeURIComponent(`/pricing?plan=founder&currency=${effectiveCurrency}`)}`);
        return;
      }
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "founder", currency: effectiveCurrency }),
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Checkout failed");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      console.error("Unable to start lifetime checkout", error);
      setCheckoutTier(null);
    }
  }, [effectiveCurrency, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTier = params.get("plan");
    const requestedCycle = params.get("cycle");
    const requestedCurrency = params.get("currency");
    const currency = requestedCurrency === "inr" ? "inr" : "usd";
    if ((requestedTier === "pro" || requestedTier === "starter" || requestedTier === "builder") && (requestedCycle === "monthly" || requestedCycle === "yearly")) {
      authClient.getSession().then(({ data }) => {
        if (data?.session) startCheckout("pro", requestedCycle, currency);
      });
    } else if (requestedTier === "founder") {
      authClient.getSession().then(({ data }) => {
        if (data?.session) startFounderCheckout();
      });
    }
  }, [startCheckout, startFounderCheckout]);

  const founderPrice = effectiveCurrency === "inr" ? `₹${founderPlan.price.inr.toLocaleString("en-IN")}` : `$${founderPlan.price.usd}`;
  const founderMonths = Math.round(
    (founderPlan.price[effectiveCurrency] / paidPlans.pro.yearly[effectiveCurrency]) * 12
  );
  const founderSoldOut = (founderCount?.remaining ?? 1) <= 0;
  const founderClaimedPct = founderCount && founderCount.cap
    ? Math.min(100, Math.round((founderCount.count / founderCount.cap) * 100))
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your agent, in your pocket — or always reachable
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free with your own tunnel. Upgrade to Pro for the hosted relay and power features.
            </p>
          </div>

          <div className="mx-auto mt-10 flex flex-wrap justify-center gap-3">
            <div className="inline-flex rounded-lg border bg-muted p-1" role="group" aria-label="Billing cycle">
              {(["monthly", "yearly"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCycle(option)}
                  aria-pressed={cycle === option}
                  className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${cycle === option ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {option === "monthly" ? "Monthly" : "Yearly"}
                  {option === "yearly" && <span className="ml-2 text-xs text-primary">Save {discountPercent("pro", effectiveCurrency)}%</span>}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border bg-muted p-1" role="group" aria-label="Currency">
              {(["usd", "inr"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCurrency(option)}
                  aria-pressed={effectiveCurrency === option}
                  className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${effectiveCurrency === option ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {option === "usd" ? "USD" : "INR"}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-2">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`flex flex-col ${
                  tier.highlighted
                    ? "border-primary shadow-lg shadow-primary/10"
                    : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    {tier.highlighted && (
                      <Badge>Most Popular</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {tier.tier
                        ? `${effectiveCurrency === "inr" ? "₹" : "$"}${paidPlans[tier.tier][cycle][effectiveCurrency]}`
                        : effectiveCurrency === "inr" ? "₹0" : "$0"}
                    </span>
                    <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  {tier.tier && (
                    <>
                      {effectiveCurrency === "inr" && (
                        <p className="text-xs text-muted-foreground">
                          {`≈ $${paidPlans[tier.tier][cycle].usd}/${cycle === "monthly" ? "mo" : "yr"}`}
                        </p>
                      )}
                      {cycle === "yearly" && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Save {discountPercent(tier.tier, effectiveCurrency)}% versus monthly
                        </p>
                      )}
                    </>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        {"href" in feature && feature.href ? (
                          feature.label === "Unlimited fair-use traffic" ? (
                            <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                              Unlimited{" "}
                              <Link
                                href={feature.href}
                                className="underline underline-offset-4 hover:text-primary"
                              >
                                fair-use
                              </Link>{" "}
                              traffic
                            </span>
                          ) : (
                            <Link
                              href={feature.href}
                              className={`${feature.included ? "text-foreground" : "text-muted-foreground"} underline underline-offset-4 hover:text-primary`}
                            >
                              {feature.label}
                            </Link>
                          )
                        ) : (
                          <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                            {feature.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "outline"}
                    disabled={Boolean(tier.tier && checkoutTier)}
                    asChild={!tier.tier}
                    onClick={tier.tier ? () => startCheckout(tier.tier!) : undefined}
                  >
                    {tier.tier ? (checkoutTier === tier.tier ? "Opening checkout..." : tier.cta) : <Link href={tier.ctaHref}>{tier.cta}</Link>}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card className="relative mx-auto mt-6 max-w-5xl overflow-hidden border-primary/40 bg-gradient-to-br from-primary/[0.06] via-card to-card py-0">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-background/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {founderSoldOut ? "Sold out" : "One-time · Best value"}
                </Badge>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">Pro Lifetime</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Pay once. Pro forever — hosted relay, every power feature, no renewals and no future price hikes.
                  </p>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {["Everything in Pro", "5 hosted tunnels", "Price locked for life"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 md:border-l md:border-border/60 md:pl-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight md:text-5xl">{founderPrice}</span>
                  <span className="text-xs text-muted-foreground">one-time</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ {founderMonths} months of Pro Yearly
                </p>
                <div className="space-y-1.5">
                  <div
                    role="progressbar"
                    aria-label="Pro Lifetime seats claimed"
                    aria-valuemin={0}
                    aria-valuemax={founderCount?.cap ?? founderPlan.cap}
                    aria-valuenow={founderCount?.count ?? 0}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${founderClaimedPct}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {founderCount
                      ? `${founderCount.count} of ${founderCount.cap} claimed — ${founderCount.remaining} left`
                      : `Limited to ${founderPlan.cap}`}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={Boolean(checkoutTier) || founderSoldOut}
                  onClick={startFounderCheckout}
                >
                  {checkoutTier === "founder" ? "Opening checkout..." : founderSoldOut ? "Sold out" : "Claim Pro Lifetime"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Secure checkout · instant access
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mx-auto mt-20 max-w-5xl px-4">
            <h2 className="text-2xl font-bold">Compare plans</h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 pr-4 pl-6 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="px-4 py-3 text-left font-medium">Free</th>
                    <th className="py-3 pl-4 pr-6 text-left font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section) => (
                    <React.Fragment key={section.category}>
                      <tr key={section.category} className="border-b bg-muted/50">
                        <td colSpan={3} className="py-2 pr-4 pl-6 font-semibold">
                          {section.category}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b">
                          <td className="py-3 pr-4 pl-6 text-muted-foreground">{row.label}</td>
                          {row.values.map((value, i) => (
                            <td key={i} className={`py-3 text-left ${i === 0 ? "pl-4 pr-4" : "pl-4 pr-6"}`}>
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Pro Lifetime unlocks everything in Pro, forever. Grandfathered Starter/Builder subscribers now show as Pro.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
