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
    price: "$2",
    period: "/mo",
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
    price: "$5",
    period: "/mo",
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
    price: "Custom",
    period: "",
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
                    {tier.period && (
                      <span className="text-sm text-muted-foreground">{tier.period}</span>
                    )}
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
                        {feature.href ? (
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
