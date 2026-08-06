import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, ArrowRight } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For trying out CrossCode",
    features: [
      "Cloudflare (ephemeral) tunnel",
      "1 active tunnel",
      "1 concurrent session",
      "Best-effort uptime",
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
      "Custom VPS tunnel",
      "2 active tunnels",
      "3 concurrent sessions",
      "99% SLA uptime",
    ],
    cta: "Upgrade",
    ctaHref: "/login",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/mo",
    description: "For power users and freelancers",
    features: [
      "Custom VPS tunnel",
      "5 active tunnels",
      "10 concurrent sessions",
      "99.9% SLA uptime",
    ],
    cta: "Upgrade",
    ctaHref: "/login",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "/mo",
    description: "For teams and organizations",
    features: [
      "Custom VPS tunnel",
      "15 active tunnels",
      "Unlimited sessions",
      "99.9% SLA uptime",
    ],
    cta: "Upgrade",
    ctaHref: "/login",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h2>
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
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
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

      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View full plan comparison
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
