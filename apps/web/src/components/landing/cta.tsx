import Link from "next/link";
import { Terminal, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cli" className="container py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card px-6 py-12 text-center md:px-10 md:py-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">
          <Terminal className="h-3 w-3" />
          One command away
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          Run one command on your PC, scan the QR code from your phone, and you&apos;re connected. No accounts, no config files, no friction.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-lg border bg-muted px-4 py-2 font-mono text-sm">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>npx crosscode</span>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/download">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="https://github.com/snhsish/crosscode" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View on GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
