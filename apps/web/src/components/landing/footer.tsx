import { Github, Smartphone } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <span className="font-semibold">CrossCode</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="https://github.com/snhsish/crosscode" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            <Github className="h-5 w-5" />
          </Link>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
