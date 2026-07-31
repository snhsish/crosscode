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
      <p className="mt-4 text-muted-foreground">Coming soon.</p>
    </div>
  );
}
