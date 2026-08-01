import { DocsSidebar } from "@/components/docs/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            CrossCode
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="container flex">
        <DocsSidebar />
        <main className="flex-1 overflow-hidden py-8 px-8 prose prose-invert max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
