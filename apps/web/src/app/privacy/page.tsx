import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - CrossCode",
  description: "Privacy Policy for CrossCode",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: August 1, 2026</p>

      <div className="prose prose-invert max-w-none mt-8">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          CrossCode (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
          use our service, including our CLI tool, mobile app, and web application.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

        <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>
        <p className="text-muted-foreground leading-7 mb-4">
          When you create an account, we collect:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Email address</li>
          <li>Name</li>
          <li>Profile image (optional)</li>
          <li>Password (stored in hashed form)</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">Session Data</h3>
        <p className="text-muted-foreground leading-7 mb-4">
          When you log in, we automatically collect:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>IP address</li>
          <li>User agent string</li>
          <li>Session token</li>
          <li>Login timestamps</li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 mb-3">API Keys</h3>
        <p className="text-muted-foreground leading-7 mb-4">
          When you generate an API key for CLI authentication, we store the key associated with your account.
          API keys are prefixed with <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">cc_</code> and
          can be regenerated at any time.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Waitlist Information</h3>
        <p className="text-muted-foreground leading-7 mb-4">
          If you join our early access waitlist, we collect your email address.
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">OAuth Data</h3>
        <p className="text-muted-foreground leading-7 mb-4">
          If you sign in using a third-party provider (e.g., GitHub, Google), we may receive:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Access tokens and refresh tokens</li>
          <li>Account ID from the provider</li>
          <li>Scope of permissions granted</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We use the collected information to:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Authenticate your identity and manage your account</li>
          <li>Provide and maintain the Service</li>
          <li>Generate and validate API keys for CLI access</li>
          <li>Send verification emails and OTP codes</li>
          <li>Communicate with you about updates and early access</li>
          <li>Monitor for security threats and abuse</li>
          <li>Improve the Service</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. How Your Data Flows</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          When you run <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">npx crosscode</code>, the CLI:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Starts a local OpenCode server on your machine</li>
          <li>Establishes a secure tunnel via Cloudflare</li>
          <li>Validates your API key against our database</li>
        </ul>
        <p className="text-muted-foreground leading-7 mb-4">
          Your code and files never leave your machine. The tunnel only exposes the OpenCode server interface
          to your mobile app for remote control.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Storage</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          Your data is stored in a PostgreSQL database hosted on Neon. We implement appropriate security
          measures to protect your data, including:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>SSL/TLS encryption for database connections</li>
          <li>Password hashing using industry-standard algorithms</li>
          <li>Session tokens with expiration</li>
          <li>Connection pooling with idle timeouts</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Email Communications</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We send emails for:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Email verification during sign-up</li>
          <li>One-time password (OTP) codes for authentication</li>
          <li>Early access notifications (if you join the waitlist)</li>
        </ul>
        <p className="text-muted-foreground leading-7 mb-4">
          Emails are sent via SMTP. You can opt out of non-essential communications at any time.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Sharing</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We do not sell, trade, or rent your personal information to third parties. We may share data:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>With Cloudflare for tunnel establishment (technical necessity)</li>
          <li>With OAuth providers during authentication (only what you authorize)</li>
          <li>When required by law or to protect our rights</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We retain your data for as long as your account is active. You can request account deletion by
          contacting us. Session data is automatically cleaned up based on expiration policies.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Your Rights</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          You have the right to:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Export your data</li>
          <li>Opt out of communications</li>
          <li>Revoke API keys at any time</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Security</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We implement security measures including encrypted connections, hashed passwords, session expiration,
          and API key validation. However, no method of transmission over the Internet is 100% secure.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Children&apos;s Privacy</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          CrossCode is not intended for children under 13. We do not knowingly collect personal information
          from children under 13. If you believe we have collected such data, please contact us immediately.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to This Policy</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an
          updated revision date. Continued use of the Service constitutes acceptance of the updated policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at{" "}
          <a href="mailto:crosscode@sish.work" className="text-primary underline">
            crosscode@sish.work
          </a>.
        </p>
      </div>
    </div>
  );
}
