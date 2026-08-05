import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Terminal, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Download CrossCode
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Get the mobile app and CLI to start controlling your AI coding agent from anywhere.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Mobile App</CardTitle>
                </div>
                <CardDescription className="mt-3">
                  Download the mobile app to control your OpenCode sessions from your phone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">Android</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Currently available for Android devices. iOS coming soon.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/download/android">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Download for Android
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Terminal className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">CLI</CardTitle>
                </div>
                <CardDescription className="mt-3">
                  Install the CLI to start the tunnel server on your PC.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium">Install from npm</p>
                  <code className="mt-2 block rounded bg-background px-3 py-2 text-sm font-mono">
                    npm install -g crosscode
                  </code>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href="https://npmjs.com/package/crosscode" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on npm
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Documentation</CardTitle>
                </div>
                <CardDescription className="mt-3">
                  Learn how to set up and use CrossCode with our documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild variant="outline">
                    <Link href="/docs">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Getting Started
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/docs/cli">
                      <Terminal className="mr-2 h-4 w-4" />
                      CLI Reference
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/docs/installation">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Installation Guide
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/docs/app">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Mobile App Guide
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
