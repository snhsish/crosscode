import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service - CrossCode",
  description: "Terms of Service for CrossCode",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: August 1, 2026</p>

      <div className="prose prose-invert max-w-none mt-8">
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          By accessing or using CrossCode (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, do not use the Service. CrossCode is an open-source project that
          connects your phone to your PC&apos;s OpenCode instance, allowing you to approve tool calls, review diffs,
          and manage AI coding sessions remotely.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          You must be at least 13 years old to use CrossCode. By using the Service, you represent and warrant
          that you meet this age requirement. If you are under 18, you represent that you have your parent or
          guardian&apos;s consent to use the Service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Description of Service</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          CrossCode provides:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>A CLI tool that starts an OpenCode server and establishes a secure tunnel via Cloudflare</li>
          <li>A mobile application for remotely controlling your AI coding agent</li>
          <li>A web application for account management and API key generation</li>
        </ul>
        <p className="text-muted-foreground leading-7 mb-4">
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Accounts</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          To use certain features of CrossCode, you must create an account. You are responsible for:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
        </ul>
        <p className="text-muted-foreground leading-7 mb-4">
          We reserve the right to suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. API Keys</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          CrossCode generates API keys for CLI authentication. You are responsible for:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Keeping your API keys secure and not sharing them</li>
          <li>Any activity that occurs using your API keys</li>
          <li>Regenerating keys if you suspect they have been compromised</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Acceptable Use</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          You agree not to use CrossCode to:
        </p>
        <ul className="list-disc ml-6 text-muted-foreground leading-7 mb-4 space-y-1">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the intellectual property rights of others</li>
          <li>Transmit malware, viruses, or other harmful code</li>
          <li>Attempt to gain unauthorized access to any system or network</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Use the Service for any illegal or unauthorized purpose</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Open Source License</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          CrossCode is open-source software licensed under the MIT License. The source code is available
          on GitHub. Your use of the open-source components is subject to the terms of the MIT License.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimer of Warranties</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
          INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          IN NO EVENT SHALL CROSSCODE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR
          USE OF THE SERVICE.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Indemnification</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          You agree to indemnify and hold harmless CrossCode from any claims, damages, losses, or expenses
          arising from your use of the Service or violation of these terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Modifications</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          We reserve the right to modify these terms at any time. Changes will be effective immediately upon
          posting. Your continued use of the Service after changes constitutes acceptance of the modified terms.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          These terms shall be governed by and construed in accordance with the laws of India, without regard
          to its conflict of law provisions. Any disputes arising from these terms shall be resolved in the
          courts of India.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact</h2>
        <p className="text-muted-foreground leading-7 mb-4">
          If you have questions about these Terms of Service, please contact us at{" "}
          <a href="mailto:crosscode@sish.work" className="text-primary underline">
            crosscode@sish.work
          </a>.
        </p>
      </div>
    </div>
  );
}
