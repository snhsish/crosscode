import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import Link from "next/link";
import React from "react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For trying out CrossCode",
    features: [
      { label: "Cloudflare (ephemeral) tunnel", included: true },
      { label: "1 active tunnel", included: true },
      { label: "1 concurrent session", included: true },
      { label: "Best-effort uptime", included: true },
      { label: "No custom subdomain", included: false },
      { label: "15s heartbeat interval", included: true },
      { label: "60 req/min rate limit", included: true },
      { label: "No push notifications", included: false },
      { label: "No priority support", included: false },
      { label: "No connection history", included: false },
    ],
    cta: "Get Started",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$3",
    period: "/mo",
    description: "For individual developers",
    features: [
      { label: "Custom VPS tunnel", included: true },
      { label: "2 active tunnels", included: true },
      { label: "3 concurrent sessions", included: true },
      { label: "99% SLA uptime", included: true },
      { label: "*.tunnel.crosscode.site subdomain", included: true },
      { label: "10s heartbeat interval", included: true },
      { label: "200 req/min rate limit", included: true },
      { label: "Push notifications", included: true },
      { label: "Email support", included: true },
      { label: "7 days connection history", included: true },
    ],
    cta: "Upgrade to Starter",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/mo",
    description: "For power users and freelancers",
    features: [
      { label: "Custom VPS tunnel", included: true },
      { label: "5 active tunnels", included: true },
      { label: "10 concurrent sessions", included: true },
      { label: "99.9% SLA uptime", included: true },
      { label: "*.tunnel.crosscode.site subdomain", included: true },
      { label: "5s heartbeat interval", included: true },
      { label: "500 req/min rate limit", included: true },
      { label: "Push notifications", included: true },
      { label: "Email + Discord support", included: true },
      { label: "30 days connection history", included: true },
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/login",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "/mo",
    description: "For teams and organizations",
    features: [
      { label: "Custom VPS tunnel", included: true },
      { label: "15 active tunnels", included: true },
      { label: "Unlimited concurrent sessions", included: true },
      { label: "99.9% SLA uptime", included: true },
      { label: "Own domain support", included: true },
      { label: "5s heartbeat interval", included: true },
      { label: "2000 req/min rate limit", included: true },
      { label: "Push notifications", included: true },
      { label: "Dedicated support", included: true },
      { label: "90 days connection history", included: true },
    ],
    cta: "Upgrade to Team",
    ctaHref: "/login",
    highlighted: false,
  },
];

const comparisonFeatures = [
  {
    category: "Tunnel",
    rows: [
      { label: "Tunnel type", values: ["Cloudflare (ephemeral)", "Custom VPS tunnel", "Custom VPS tunnel", "Custom VPS tunnel"] },
      { label: "Active tunnels", values: ["1", "2", "5", "15"] },
      { label: "Concurrent sessions", values: ["1", "3", "10", "Unlimited"] },
      { label: "Tunnel uptime", values: ["Best-effort", "99% SLA", "99.9% SLA", "99.9% SLA"] },
    ],
  },
  {
    category: "Customization",
    rows: [
      { label: "Custom subdomain", values: ["No", "*.tunnel.crosscode.site", "*.tunnel.crosscode.site", "Own domain support"] },
    ],
  },
  {
    category: "Performance",
    rows: [
      { label: "Heartbeat interval", values: ["15s", "10s", "5s", "5s"] },
      { label: "Rate limit", values: ["60 req/min", "200 req/min", "500 req/min", "2000 req/min"] },
    ],
  },
  {
    category: "Support & Extras",
    rows: [
      { label: "Push notifications", values: ["No", "Yes", "Yes", "Yes"] },
      { label: "Priority support", values: ["No", "Email", "Email + Discord", "Dedicated"] },
      { label: "Connection history", values: ["None", "7 days", "30 days", "90 days"] },
    ],
  },
];

export const metadata = {
  title: "Pricing - CrossCode",
  description: "Simple, transparent pricing for CrossCode. Choose the plan that fits your needs.",
};

export default function PricingPage() {
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

          <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
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
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href={tier.ctaHref}>{tier.cta}</Link>
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
                    <th className="px-4 py-3 text-left font-medium">Pro</th>
                    <th className="py-3 pl-4 pr-6 text-left font-medium">Team</th>
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
