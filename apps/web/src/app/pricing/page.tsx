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
import { paidPlans, type BillingCurrency, type BillingCycle, type PaidTier } from "@crosscode/shared";

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
    description: "For trying out CrossCode",
    features: [
      { label: "Cloudflare (ephemeral) tunnel", included: true },
      { label: "1 active tunnel", included: true },
      { label: "Fair-use traffic", included: true },
      { label: "Best-effort uptime", included: true },
      { label: "No custom subdomain", included: false },
      { label: "No custom domain", included: false },
      { label: "No SLA", included: false },
      { label: "Community support", included: true },
    ],
    cta: "Get Started",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Starter",
    tier: "starter" as PaidTier,
    description: "For individual developers",
    features: [
      { label: "Custom VPS tunnel", included: true },
      { label: "1 active tunnel", included: true },
      { label: "Unlimited fair-use traffic", included: true, href: "/legal/fair-usage" },
      { label: "Shared infrastructure", included: true },
      { label: "*.tunnel.crosscode.site subdomain", included: true },
      { label: "Best-effort uptime", included: true },
      { label: "Community support", included: true },
      { label: "No custom domain", included: false },
      { label: "No SLA", included: false },
    ],
    cta: "Upgrade to Starter",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Builder",
    tier: "builder" as PaidTier,
    description: "For power users and small teams",
    features: [
      { label: "Custom VPS tunnel", included: true },
      { label: "5 active tunnels", included: true },
      { label: "Unlimited fair-use traffic", included: true, href: "/legal/fair-usage" },
      { label: "Shared infrastructure", included: true },
      { label: "*.tunnel.crosscode.site subdomain", included: true },
      { label: "1 custom domain", included: true },
      { label: "Best-effort uptime", included: true },
      { label: "Email support", included: true },
      { label: "No dedicated capacity", included: false },
      { label: "No SLA", included: false },
    ],
    cta: "Upgrade to Builder",
    ctaHref: "/login",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tier: null,
    description: "For teams with tailored requirements",
    features: [
      { label: "Custom tunnel limits", included: true },
      { label: "Custom domains", included: true },
      { label: "Dedicated capacity", included: true },
      { label: "Priority support", included: true },
      { label: "Custom SLA", included: true },
      { label: "Annual invoicing", included: true },
      { label: "Custom onboarding", included: true },
    ],
    cta: "Contact us",
    ctaHref: "mailto:crosscode@sish.work?subject=CrossCode%20Enterprise",
    highlighted: false,
  },
];

function discountPercent(tier: PaidTier, currency: "usd" | "inr") {
  const plan = paidPlans[tier];
  return Math.round((1 - plan.yearly[currency] / (plan.monthly[currency] * 12)) * 100);
}

const comparisonFeatures = [
  {
    category: "Tunnel",
    rows: [
      { label: "Tunnel type", values: ["Cloudflare (ephemeral)", "Custom VPS tunnel", "Custom VPS tunnel", "Custom relay"] },
      { label: "Active tunnels", values: ["1", "1", "5", "Custom"] },
      { label: "Traffic", values: ["Fair use", "Unlimited fair use", "Unlimited fair use", "Custom"] },
      { label: "Tunnel uptime", values: ["Best-effort", "Best-effort", "Best-effort", "Custom SLA"] },
    ],
  },
  {
    category: "Customization",
    rows: [
      { label: "CrossCode subdomain", values: ["No", "Yes", "Yes", "Yes"] },
      { label: "Custom domain", values: ["No", "No", "1 domain", "Custom"] },
    ],
  },
  {
    category: "Infrastructure",
    rows: [
      { label: "Infrastructure", values: ["Cloudflare", "Shared", "Shared", "Dedicated or reserved"] },
      { label: "Priority support", values: ["No", "No", "Email", "Yes"] },
    ],
  },
  {
    category: "Billing & Support",
    rows: [
      { label: "Annual invoicing", values: ["No", "No", "No", "Yes"] },
      { label: "Custom onboarding", values: ["No", "No", "No", "Yes"] },
      { label: "SLA", values: ["No", "No", "No", "Custom"] },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [currency, setCurrency] = useState<BillingCurrency | null>(null);
  const detectedCurrency = useDetectedCurrency();
  const effectiveCurrency = currency ?? detectedCurrency;
  const [checkoutTier, setCheckoutTier] = useState<PaidTier | null>(null);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTier = params.get("plan");
    const requestedCycle = params.get("cycle");
    const requestedCurrency = params.get("currency");
    if ((requestedTier === "starter" || requestedTier === "builder") && (requestedCycle === "monthly" || requestedCycle === "yearly")) {
      authClient.getSession().then(({ data }) => {
        if (data?.session) startCheckout(requestedTier, requestedCycle, requestedCurrency === "inr" ? "inr" : "usd");
      });
    }
  }, [startCheckout]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free and scale as you grow. No hidden fees, no surprises.
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
                  {option === "yearly" && <span className="ml-2 text-xs text-primary">Save ~17%</span>}
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

          <div className="mx-auto mt-8 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                        : tier.name === "Free"
                          ? effectiveCurrency === "inr" ? "₹0" : "$0"
                          : "Custom"}
                    </span>
                    {tier.name !== "Enterprise" && <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</span>}
                  </div>
                  {tier.tier && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {effectiveCurrency === "inr" ? `≈ $${paidPlans[tier.tier][cycle].usd}/yr` : `India: ₹${paidPlans[tier.tier][cycle].inr}/${cycle === "monthly" ? "mo" : "yr"}`}
                      </p>
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

          <div className="mx-auto mt-20 max-w-7xl px-4">
            <h2 className="text-2xl font-bold">Compare plans</h2>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 pr-4 pl-6 text-left font-medium text-muted-foreground">Feature</th>
                    <th className="px-4 py-3 text-left font-medium">Free</th>
                    <th className="px-4 py-3 text-left font-medium">Starter</th>
                    <th className="px-4 py-3 text-left font-medium">Builder</th>
                    <th className="py-3 pl-4 pr-6 text-left font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section) => (
                    <React.Fragment key={section.category}>
                      <tr key={section.category} className="border-b bg-muted/50">
                        <td colSpan={5} className="py-2 pr-4 font-semibold">
                          {section.category}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.label} className="border-b">
                          <td className="py-3 pr-4 pl-6 text-muted-foreground">{row.label}</td>
                          {row.values.map((value, i) => (
                            <td key={i} className={`py-3 text-left ${i === 0 ? "pl-4 pr-4" : i === row.values.length - 1 ? "pl-4 pr-6" : "px-4"}`}>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
