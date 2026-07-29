import { Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <span className="font-semibold text-lg">CrossCode</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Control your AI coding agent from anywhere. Open source and built for developers.
            </p>
          </div>{" "}
          {/* Social & nav links temporarily disabled */}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CrossCode. MIT License.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
