import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <BrandLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/download" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Download
          </Link>
          <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/docs/cli" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            CLI
          </Link>
          <Link href="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Support
          </Link>
          <a
            href="https://github.com/snhsish/crosscode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
