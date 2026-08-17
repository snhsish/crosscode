import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Fair Use Policy - CrossCode",
  description: "Fair use policy for CrossCode tunnel traffic.",
};

export default function FairUsagePage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <Link
        href="/pricing"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pricing
      </Link>

      <h1 className="text-3xl md:text-4xl font-bold">Fair Use Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: August 18, 2026</p>

      <div className="prose prose-invert max-w-none mt-8">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Unlimited fair-use traffic</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          Paid CrossCode plans do not impose an artificial bandwidth quota for normal development use. You may use
          your active tunnels for coding, testing, agent sessions, API requests, and related development workflows.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">What is not fair use</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          The service is not intended to replace a general-purpose hosting, file distribution, streaming, proxy, or
          VPN service. We may investigate or restrict usage that:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Creates sustained traffic that materially affects other customers</li>
          <li>Distributes large files or media as a public download service</li>
          <li>Runs automated scraping, bulk requests, or abusive workloads</li>
          <li>Attempts to bypass service limits or security controls</li>
          <li>Violates applicable law or the CrossCode Terms of Service</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">How we respond</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          When practical, we will contact you before taking action. Depending on the severity and urgency, CrossCode
          may throttle traffic, temporarily disable a tunnel, or suspend an account to protect service availability
          and other users.
        </p>

        <p className="text-muted-foreground leading-7 mb-4">
          If your workload requires sustained high-volume traffic or dedicated capacity, contact us about an
          Enterprise plan.
        </p>
      </div>
    </div>
  );
}
