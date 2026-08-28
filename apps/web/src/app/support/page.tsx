"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { AlertTriangle, ExternalLink, Github, Mail } from "lucide-react";


const categories = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "Question" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
] as const;

const GITHUB_NEW_ISSUE = "https://github.com/snhsish/crosscode/issues/new";

export default function SupportPage() {
  const [category, setCategory] = useState<string>("question");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const issueTitle = `[${categories.find((c) => c.value === category)?.label ?? category}] ${title}`.slice(0, 120);
    const bodyParts = [description];
    if (email.trim()) bodyParts.push(`\n---\nContact: ${email.trim()}`);
    bodyParts.push("\n_via /support_");
    const body = bodyParts.join("\n\n");
    const params = new URLSearchParams({
      title: issueTitle,
      body,
      labels: `support,${category}`,
    });
    window.location.href = `${GITHUB_NEW_ISSUE}?${params.toString()}`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Support</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Need help? Create a GitHub issue and we&apos;ll get back to you.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">This will be public</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200/80">
                    Issues created from this form are visible publicly on GitHub. For sensitive or private support, email{" "}
                    <a href="mailto:support@crosscode.site" className="font-medium underline underline-offset-4 hover:text-amber-900 dark:hover:text-amber-100">
                      support@crosscode.site
                    </a>
                    {" "}instead.
                  </p>
                </div>
              </div>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Github className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Create a support issue</CardTitle>
                    <CardDescription className="mt-1">You&apos;ll be redirected to GitHub to submit</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="title"
                      placeholder="Brief summary of your request"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="description"
                      placeholder="Describe your issue or question in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={6}
                      maxLength={2000}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Contact email <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={!title.trim() || !description.trim()}>
                    <Github className="h-4 w-4" />
                    Continue on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <div className="flex flex-col items-center gap-2 border-t pt-5 sm:flex-row sm:justify-center">
                    <p className="text-sm text-muted-foreground">For private matters</p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="mailto:support@crosscode.site">
                        <Mail className="h-4 w-4" />
                        support@crosscode.site
                      </a>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already on GitHub?{" "}
              <a href={GITHUB_NEW_ISSUE} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
                Open a new issue directly
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
