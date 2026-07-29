import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";
import { FlickeringGrid } from "./flickering-grid";

export function CTA() {
  return (
    <section id="cli" className="container py-20">
      <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-6 md:px-8 py-12 md:py-16 text-center text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 [mask-image:radial-gradient(circle_at_center,black_0%,transparent_70%)]">
          <FlickeringGrid />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to get started?</h2>
          <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
            Run one command on your PC, scan the QR code from your phone, and you&apos;re connected.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-6 py-3 font-mono text-sm">
              <Terminal className="h-4 w-4" />
              <span>npx crosscode</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <a href="https://github.com/snhsish/crosscode" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
