import { Github, Star } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold">CrossCode</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/features" className="text-sm font-medium hover:text-foreground/80 transition-colors">
            Features
          </Link>
          <Link href="/download" className="text-sm font-medium hover:text-foreground/80 transition-colors">
            Download
          </Link>
          <Link href="/changelog" className="text-sm font-medium hover:text-foreground/80 transition-colors">
            Changelog
          </Link>
        </nav>
        <div className="flex items-center">
          <Link
            href="https://github.com/snhsish/crosscode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>Star</span>
            <span className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-xs">
              <Star className="h-3 w-3 fill-current" />
              <span>5</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
