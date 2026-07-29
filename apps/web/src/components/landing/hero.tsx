"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlyphMatrix } from "@/components/ui/glyph-matrix";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    const res = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus("success")
      setMessage("You're on the list!")
      setEmail("")
    } else {
      setStatus("error")
      setMessage(data.error || "Something went wrong")
    }
  }

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
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Input
            type="email"
            placeholder="Enter your email for early access"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Button type="submit" size="lg" className="rounded-full shrink-0" disabled={status === "loading"}>
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Early Access"}
          </Button>
        </form>
        {message && (
          <p className={`mt-2 text-sm ${status === "success" ? "text-emerald-500" : "text-red-500"}`}>{message}</p>
        )}
        {/* <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/download">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-full" asChild>
            <Link href="/login">
              Login
            </Link>
          </Button>
        </div> */}
        <div className="mt-16 w-full max-w-5xl flex flex-col lg:flex-row gap-10 items-start justify-center">
          <div className="w-full max-w-lg flex flex-col">
            <div className="rounded-xl border bg-card h-[300px] md:h-[380px] shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center px-4 py-3 border-b border-border">
                <div className="flex gap-1.5 mr-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">~/your/project</span>
              </div>
              <div className="p-6 font-mono text-sm space-y-2 flex-1 flex flex-col text-left">
                <div>
                  <span className="text-emerald-500">$</span><span className="text-foreground">  npx crosscode</span>
                </div>
                <div className="text-muted-foreground">
                  <span className="text-emerald-500">✓</span> OpenCode server started
                </div>
                <div className="text-muted-foreground">
                  <span className="text-emerald-500">✓</span> Cloudflare Tunnel connected
                </div>
                <div>
                  <span className="text-sky-500">▲</span> <span className="text-muted-foreground">Ready →</span> <span className="text-sky-500 underline">https://myapp.trycrosscode.dev</span>
                </div>
                <div className="pt-4">
                  <svg width="140" height="140" viewBox="0 0 29 29" className="block">
                    <rect width="29" height="29" fill="currentColor" className="text-background"/>
                    <g className="text-foreground">
                      <rect x="0" y="0.5" width="7" height="1"/><rect x="9" y="0.5" width="7" height="1"/><rect x="18" y="0.5" width="3" height="1"/><rect x="22" y="0.5" width="7" height="1"/>
                      <rect x="0" y="1.5" width="1" height="1"/><rect x="6" y="1.5" width="1" height="1"/><rect x="9" y="1.5" width="3" height="1"/><rect x="13" y="1.5" width="6" height="1"/><rect x="20" y="1.5" width="1" height="1"/><rect x="22" y="1.5" width="1" height="1"/><rect x="28" y="1.5" width="1" height="1"/>
                      <rect x="0" y="2.5" width="1" height="1"/><rect x="2" y="2.5" width="3" height="1"/><rect x="6" y="2.5" width="1" height="1"/><rect x="8" y="2.5" width="3" height="1"/><rect x="12" y="2.5" width="2" height="1"/><rect x="15" y="2.5" width="1" height="1"/><rect x="19" y="2.5" width="1" height="1"/><rect x="22" y="2.5" width="1" height="1"/><rect x="24" y="2.5" width="3" height="1"/><rect x="28" y="2.5" width="1" height="1"/>
                      <rect x="0" y="3.5" width="1" height="1"/><rect x="2" y="3.5" width="3" height="1"/><rect x="6" y="3.5" width="1" height="1"/><rect x="8" y="3.5" width="2" height="1"/><rect x="11" y="3.5" width="1" height="1"/><rect x="14" y="3.5" width="2" height="1"/><rect x="17" y="3.5" width="1" height="1"/><rect x="20" y="3.5" width="1" height="1"/><rect x="22" y="3.5" width="1" height="1"/><rect x="24" y="3.5" width="3" height="1"/><rect x="28" y="3.5" width="1" height="1"/>
                      <rect x="0" y="4.5" width="1" height="1"/><rect x="2" y="4.5" width="3" height="1"/><rect x="6" y="4.5" width="1" height="1"/><rect x="8" y="4.5" width="1" height="1"/><rect x="11" y="4.5" width="1" height="1"/><rect x="15" y="4.5" width="6" height="1"/><rect x="22" y="4.5" width="1" height="1"/><rect x="24" y="4.5" width="3" height="1"/><rect x="28" y="4.5" width="1" height="1"/>
                      <rect x="0" y="5.5" width="1" height="1"/><rect x="6" y="5.5" width="1" height="1"/><rect x="8" y="5.5" width="1" height="1"/><rect x="10" y="5.5" width="1" height="1"/><rect x="17" y="5.5" width="1" height="1"/><rect x="20" y="5.5" width="1" height="1"/><rect x="22" y="5.5" width="1" height="1"/><rect x="28" y="5.5" width="1" height="1"/>
                      <rect x="0" y="6.5" width="7" height="1"/><rect x="8" y="6.5" width="1" height="1"/><rect x="10" y="6.5" width="1" height="1"/><rect x="12" y="6.5" width="1" height="1"/><rect x="14" y="6.5" width="1" height="1"/><rect x="16" y="6.5" width="1" height="1"/><rect x="18" y="6.5" width="1" height="1"/><rect x="20" y="6.5" width="1" height="1"/><rect x="22" y="6.5" width="7" height="1"/>
                      <rect x="8" y="7.5" width="1" height="1"/><rect x="10" y="7.5" width="3" height="1"/><rect x="14" y="7.5" width="1" height="1"/><rect x="16" y="7.5" width="1" height="1"/><rect x="19" y="7.5" width="1" height="1"/>
                      <rect x="0" y="8.5" width="1" height="1"/><rect x="2" y="8.5" width="5" height="1"/><rect x="9" y="8.5" width="1" height="1"/><rect x="12" y="8.5" width="1" height="1"/><rect x="16" y="8.5" width="2" height="1"/><rect x="20" y="8.5" width="1" height="1"/><rect x="22" y="8.5" width="5" height="1"/>
                      <rect x="1" y="9.5" width="3" height="1"/><rect x="7" y="9.5" width="1" height="1"/><rect x="13" y="9.5" width="3" height="1"/><rect x="18" y="9.5" width="3" height="1"/><rect x="22" y="9.5" width="3" height="1"/><rect x="28" y="9.5" width="1" height="1"/>
                      <rect x="1" y="10.5" width="1" height="1"/><rect x="6" y="10.5" width="3" height="1"/><rect x="10" y="10.5" width="2" height="1"/><rect x="13" y="10.5" width="4" height="1"/><rect x="20" y="10.5" width="2" height="1"/><rect x="24" y="10.5" width="1" height="1"/>
                      <rect x="0" y="11.5" width="2" height="1"/><rect x="3" y="11.5" width="1" height="1"/><rect x="8" y="11.5" width="1" height="1"/><rect x="10" y="11.5" width="1" height="1"/><rect x="13" y="11.5" width="1" height="1"/><rect x="15" y="11.5" width="1" height="1"/><rect x="18" y="11.5" width="4" height="1"/><rect x="24" y="11.5" width="2" height="1"/><rect x="27" y="11.5" width="1" height="1"/>
                      <rect x="0" y="12.5" width="1" height="1"/><rect x="2" y="12.5" width="2" height="1"/><rect x="6" y="12.5" width="4" height="1"/><rect x="11" y="12.5" width="1" height="1"/><rect x="14" y="12.5" width="2" height="1"/><rect x="17" y="12.5" width="1" height="1"/><rect x="19" y="12.5" width="1" height="1"/><rect x="21" y="12.5" width="1" height="1"/><rect x="23" y="12.5" width="1" height="1"/><rect x="25" y="12.5" width="2" height="1"/>
                      <rect x="0" y="13.5" width="1" height="1"/><rect x="2" y="13.5" width="1" height="1"/><rect x="4" y="13.5" width="1" height="1"/><rect x="8" y="13.5" width="3" height="1"/><rect x="12" y="13.5" width="1" height="1"/><rect x="15" y="13.5" width="2" height="1"/><rect x="18" y="13.5" width="7" height="1"/><rect x="28" y="13.5" width="1" height="1"/>
                      <rect x="4" y="14.5" width="1" height="1"/><rect x="6" y="14.5" width="2" height="1"/><rect x="9" y="14.5" width="1" height="1"/><rect x="11" y="14.5" width="1" height="1"/><rect x="22" y="14.5" width="5" height="1"/>
                      <rect x="0" y="15.5" width="2" height="1"/><rect x="5" y="15.5" width="1" height="1"/><rect x="7" y="15.5" width="1" height="1"/><rect x="10" y="15.5" width="3" height="1"/><rect x="14" y="15.5" width="1" height="1"/><rect x="16" y="15.5" width="1" height="1"/><rect x="19" y="15.5" width="1" height="1"/><rect x="21" y="15.5" width="2" height="1"/><rect x="24" y="15.5" width="1" height="1"/><rect x="27" y="15.5" width="1" height="1"/>
                      <rect x="0" y="16.5" width="1" height="1"/><rect x="2" y="16.5" width="3" height="1"/><rect x="6" y="16.5" width="1" height="1"/><rect x="9" y="16.5" width="3" height="1"/><rect x="16" y="16.5" width="3" height="1"/><rect x="20" y="16.5" width="1" height="1"/><rect x="25" y="16.5" width="2" height="1"/>
                      <rect x="0" y="17.5" width="1" height="1"/><rect x="2" y="17.5" width="1" height="1"/><rect x="9" y="17.5" width="3" height="1"/><rect x="13" y="17.5" width="3" height="1"/><rect x="17" y="17.5" width="4" height="1"/><rect x="22" y="17.5" width="3" height="1"/><rect x="26" y="17.5" width="1" height="1"/><rect x="28" y="17.5" width="1" height="1"/>
                      <rect x="0" y="18.5" width="1" height="1"/><rect x="2" y="18.5" width="1" height="1"/><rect x="6" y="18.5" width="1" height="1"/><rect x="9" y="18.5" width="2" height="1"/><rect x="12" y="18.5" width="6" height="1"/><rect x="20" y="18.5" width="1" height="1"/><rect x="23" y="18.5" width="2" height="1"/><rect x="26" y="18.5" width="1" height="1"/>
                      <rect x="0" y="19.5" width="1" height="1"/><rect x="2" y="19.5" width="3" height="1"/><rect x="7" y="19.5" width="4" height="1"/><rect x="12" y="19.5" width="2" height="1"/><rect x="15" y="19.5" width="1" height="1"/><rect x="18" y="19.5" width="2" height="1"/><rect x="21" y="19.5" width="1" height="1"/><rect x="27" y="19.5" width="1" height="1"/>
                      <rect x="0" y="20.5" width="1" height="1"/><rect x="5" y="20.5" width="2" height="1"/><rect x="8" y="20.5" width="1" height="1"/><rect x="10" y="20.5" width="1" height="1"/><rect x="12" y="20.5" width="1" height="1"/><rect x="14" y="20.5" width="2" height="1"/><rect x="17" y="20.5" width="1" height="1"/><rect x="20" y="20.5" width="5" height="1"/><rect x="26" y="20.5" width="3" height="1"/>
                      <rect x="8" y="21.5" width="2" height="1"/><rect x="11" y="21.5" width="1" height="1"/><rect x="15" y="21.5" width="2" height="1"/><rect x="18" y="21.5" width="1" height="1"/><rect x="20" y="21.5" width="1" height="1"/><rect x="24" y="21.5" width="5" height="1"/>
                      <rect x="0" y="22.5" width="7" height="1"/><rect x="9" y="22.5" width="2" height="1"/><rect x="19" y="22.5" width="2" height="1"/><rect x="22" y="22.5" width="1" height="1"/><rect x="24" y="22.5" width="3" height="1"/>
                      <rect x="0" y="23.5" width="1" height="1"/><rect x="6" y="23.5" width="1" height="1"/><rect x="8" y="23.5" width="3" height="1"/><rect x="12" y="23.5" width="1" height="1"/><rect x="14" y="23.5" width="1" height="1"/><rect x="16" y="23.5" width="1" height="1"/><rect x="18" y="23.5" width="3" height="1"/><rect x="24" y="23.5" width="1" height="1"/><rect x="27" y="23.5" width="2" height="1"/>
                      <rect x="0" y="24.5" width="1" height="1"/><rect x="2" y="24.5" width="3" height="1"/><rect x="6" y="24.5" width="1" height="1"/><rect x="8" y="24.5" width="1" height="1"/><rect x="10" y="24.5" width="1" height="1"/><rect x="12" y="24.5" width="1" height="1"/><rect x="17" y="24.5" width="1" height="1"/><rect x="20" y="24.5" width="5" height="1"/><rect x="26" y="24.5" width="1" height="1"/><rect x="28" y="24.5" width="1" height="1"/>
                      <rect x="0" y="25.5" width="1" height="1"/><rect x="2" y="25.5" width="3" height="1"/><rect x="6" y="25.5" width="1" height="1"/><rect x="8" y="25.5" width="1" height="1"/><rect x="10" y="25.5" width="1" height="1"/><rect x="12" y="25.5" width="1" height="1"/><rect x="14" y="25.5" width="2" height="1"/><rect x="18" y="25.5" width="2" height="1"/><rect x="23" y="25.5" width="1" height="1"/><rect x="25" y="25.5" width="2" height="1"/>
                      <rect x="0" y="26.5" width="1" height="1"/><rect x="2" y="26.5" width="3" height="1"/><rect x="6" y="26.5" width="1" height="1"/><rect x="8" y="26.5" width="4" height="1"/><rect x="13" y="26.5" width="3" height="1"/><rect x="20" y="26.5" width="1" height="1"/><rect x="22" y="26.5" width="6" height="1"/>
                      <rect x="0" y="27.5" width="1" height="1"/><rect x="6" y="27.5" width="1" height="1"/><rect x="10" y="27.5" width="2" height="1"/><rect x="14" y="27.5" width="1" height="1"/><rect x="16" y="27.5" width="1" height="1"/><rect x="19" y="27.5" width="3" height="1"/><rect x="23" y="27.5" width="3" height="1"/><rect x="27" y="27.5" width="1" height="1"/>
                      <rect x="0" y="28.5" width="7" height="1"/><rect x="8" y="28.5" width="1" height="1"/><rect x="10" y="28.5" width="2" height="1"/><rect x="14" y="28.5" width="4" height="1"/><rect x="19" y="28.5" width="1" height="1"/><rect x="21" y="28.5" width="3" height="1"/><rect x="26" y="28.5" width="1" height="1"/>
                    </g>
                  </svg>
                </div>
                <div className="mt-auto pt-4">
                  <span className="text-emerald-500">$</span><span className="inline-block w-2 h-4 bg-muted-foreground/50 animate-pulse ml-2"/>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-stretch justify-center w-full lg:w-auto">
            <div className="relative w-[220px] md:w-[260px] bg-white dark:bg-[#0a0a0a] rounded-[36px] border-[3px] border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-28 h-5 bg-gray-900 dark:bg-black rounded-b-xl z-10 border-b border-x border-gray-800 dark:border-gray-700"></div>
              <div className="flex flex-col h-[500px] md:h-[620px]">
                <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 pb-2 px-3 pt-7">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">Fix auth middleware</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">myapp</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">claude-sonnet</span>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden px-3 py-2 flex flex-col gap-2 bg-white dark:bg-[#0a0a0a]">
                  <div className="max-w-[200px] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-br-sm px-3 py-2 self-end">
                    <p className="text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed text-left">The auth middleware is throwing 401 on valid tokens. Can you check the verify function?</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-[10px] font-medium">read_file</span>
                      <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">done</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5">
                      <code className="text-[10px] text-gray-600 dark:text-gray-300 font-mono">src/middleware/auth.ts</code>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed text-left">Found it. The <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">verify</code> function expects the token without the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">Bearer</code> prefix, but the header includes it. Here&apos;s the fix:</p>
                    <div className="bg-gray-900 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] text-gray-400 font-mono">auth.ts</span>
                        <span className="text-[9px] text-green-400 font-mono ml-auto">+2 -1</span>
                      </div>
                      <pre className="text-[9px] text-gray-300 font-mono leading-relaxed overflow-hidden text-left"><code><span className="text-red-400">- const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+ const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+   ?.replace(&quot;Bearer &quot;, &quot;&quot;)</span></code></pre>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                    <span className="text-[10px] font-medium">todowrite</span>
                    <span className="text-[9px] text-green-600 dark:text-green-400 font-medium">done</span>
                  </div>
                </div>
                <div className="px-3 pb-4 pt-1">
                  <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700">
                    <div className="text-[10px] text-gray-400 px-1 pb-1 text-left">Ask anything...</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                          <span className="text-[9px] text-gray-600 dark:text-gray-300 font-medium">build</span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" className="dark:stroke-gray-900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
