"use client"

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlyphMatrix } from "@/components/ui/glyph-matrix";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { TerminalMockup } from "@/components/landing/terminal-mockup";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const glyphColor = mounted && theme === "dark" ? "#9CA3AF" : "#6B7280";
  const gridColor = mounted && theme === "dark" ? "#4B5563" : "#6B7280";

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-20 md:py-32">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 z-0 opacity-50" style={{maskImage: 'linear-gradient(to bottom right, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom right, black 0%, transparent 100%)'}}>
        <GlyphMatrix
          glyphs="01·•+*/\\<>="
          cellSize={14}
          mutationRate={0.04}
          interval={90}
          fadeBottom={0.6}
          color={glyphColor}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 z-0 opacity-50" style={{maskImage: 'linear-gradient(to top left, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top left, black 0%, transparent 100%)'}}>
        <FlickeringGrid
          squareSize={4}
          gridGap={6}
          color={gridColor}
          maxOpacity={0.5}
          flickerChance={0.3}
          className="h-full w-full"
        />
      </div>
      <div className="container relative z-10 flex flex-col items-center text-center">
        <Badge variant="secondary" className="mb-4">
          Free & Open Source
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Your OpenCode agent,<br />in your pocket
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
          CrossCode connects your phone to your PC&apos;s OpenCode instance. Approve tool calls, review diffs, and manage sessions.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button size="lg" asChild>
            <Link href="/download">Download</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
        <div className="mt-16 w-full max-w-5xl flex flex-col lg:flex-row gap-10 items-start justify-center">
          <TerminalMockup />
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
