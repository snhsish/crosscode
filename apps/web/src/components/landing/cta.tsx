import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";

export function CTA() {
  return (
    <section id="cli" className="container py-20">
      <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to get started?</h2>
        <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
          Run one command on your PC, scan the QR code from your phone, and you&apos;re connected.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-6 py-3 font-mono text-sm">
            <Terminal className="h-4 w-4" />
            <span>npx crosscode</span>
          </div>
          <Button variant="secondary" size="lg" asChild>
            <a href="https://github.com/snhsish/crosscode" target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
