import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlyphMatrix } from "@/components/ui/glyph-matrix";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden py-20 md:py-32">
      <div className="absolute top-0 left-0 w-1/2 h-1/2 z-0 opacity-50" style={{maskImage: 'linear-gradient(to bottom right, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom right, black 0%, transparent 100%)'}}>
        <GlyphMatrix
          glyphs="01·•+*/\\<>="
          cellSize={14}
          mutationRate={0.04}
          interval={90}
          fadeBottom={0.6}
          color="#6B7280"
        />
      </div>
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 z-0 opacity-50" style={{maskImage: 'linear-gradient(to top left, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top left, black 0%, transparent 100%)'}}>
        <FlickeringGrid
          squareSize={4}
          gridGap={6}
          color="#6B7280"
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
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="rounded-full" asChild>
            <Link href="/download">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-full" asChild>
            <Link href="/features">
              Features
            </Link>
          </Button>
        </div>
        <div className="mt-16 w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-stretch">
          <div className="flex-1 w-full flex flex-col">
            <div className="rounded-xl border bg-card h-[380px] shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center px-4 py-3 border-b border-border">
                <div className="flex gap-1.5 mr-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-muted-foreground">~/code</span>
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
                  <svg width="140" height="140" viewBox="0 0 25 25" className="block">
                    <rect width="25" height="25" fill="currentColor" className="text-background"/>
                    <g className="text-foreground">
                      <rect x="0" y="1" width="7" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="13" y="1" width="7" height="1"/>
                      <rect x="1" y="2" width="1" height="2"/><rect x="7" y="2" width="1" height="2"/><rect x="10" y="2" width="1" height="1"/><rect x="13" y="2" width="1" height="2"/><rect x="15" y="2" width="1" height="2"/><rect x="21" y="2" width="1" height="2"/>
                      <rect x="3" y="3" width="3" height="1"/><rect x="9" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="17" y="3" width="3" height="1"/>
                      <rect x="1" y="4" width="1" height="1"/><rect x="3" y="4" width="3" height="1"/><rect x="7" y="4" width="1" height="1"/><rect x="9" y="4" width="1" height="1"/><rect x="10" y="4" width="1" height="1"/><rect x="13" y="4" width="1" height="1"/><rect x="15" y="4" width="1" height="1"/><rect x="17" y="4" width="3" height="1"/><rect x="21" y="4" width="1" height="1"/>
                      <rect x="1" y="5" width="1" height="1"/><rect x="7" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/><rect x="10" y="5" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/><rect x="15" y="5" width="1" height="1"/><rect x="21" y="5" width="1" height="1"/>
                      <rect x="0" y="6" width="1" height="1"/><rect x="2" y="6" width="5" height="1"/><rect x="9" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="15" y="6" width="5" height="1"/><rect x="21" y="6" width="1" height="1"/>
                      <rect x="1" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/><rect x="9" y="7" width="1" height="1"/><rect x="10" y="7" width="2" height="1"/><rect x="15" y="7" width="5" height="1"/>
                      <rect x="0" y="8" width="2" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="9" y="8" width="1" height="1"/><rect x="11" y="8" width="1" height="1"/><rect x="14" y="8" width="1" height="1"/><rect x="16" y="8" width="1" height="1"/><rect x="19" y="8" width="1" height="1"/>
                      <rect x="0" y="9" width="2" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="9" y="9" width="1" height="1"/><rect x="11" y="9" width="1" height="1"/><rect x="16" y="9" width="1" height="1"/>
                      <rect x="2" y="10" width="3" height="1"/><rect x="6" y="10" width="2" height="1"/><rect x="8" y="10" width="1" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="13" y="10" width="1" height="1"/><rect x="15" y="10" width="1" height="1"/><rect x="16" y="10" width="1" height="1"/><rect x="20" y="10" width="2" height="1"/>
                      <rect x="2" y="11" width="3" height="1"/><rect x="6" y="11" width="2" height="1"/><rect x="8" y="11" width="1" height="1"/><rect x="10" y="11" width="1" height="1"/><rect x="13" y="11" width="1" height="1"/><rect x="15" y="11" width="1" height="1"/><rect x="16" y="11" width="1" height="1"/><rect x="20" y="11" width="2" height="1"/>
                      <rect x="1" y="12" width="7" height="1"/><rect x="10" y="12" width="2" height="1"/><rect x="12" y="12" width="1" height="1"/><rect x="14" y="12" width="1" height="1"/><rect x="16" y="12" width="1" height="1"/><rect x="18" y="12" width="1" height="1"/><rect x="20" y="12" width="1" height="1"/>
                      <rect x="1" y="13" width="7" height="1"/><rect x="10" y="13" width="2" height="1"/><rect x="14" y="13" width="1" height="1"/><rect x="16" y="13" width="1" height="1"/><rect x="18" y="13" width="1" height="1"/><rect x="20" y="13" width="1" height="1"/>
                      <rect x="1" y="14" width="1" height="2"/><rect x="3" y="14" width="3" height="1"/><rect x="7" y="14" width="1" height="2"/><rect x="9" y="14" width="1" height="2"/><rect x="11" y="14" width="1" height="1"/><rect x="12" y="14" width="1" height="1"/><rect x="14" y="14" width="1" height="1"/><rect x="15" y="14" width="1" height="1"/><rect x="16" y="14" width="1" height="2"/><rect x="18" y="14" width="3" height="1"/><rect x="21" y="14" width="1" height="2"/>
                      <rect x="3" y="15" width="3" height="1"/><rect x="11" y="15" width="2" height="1"/><rect x="14" y="15" width="1" height="1"/><rect x="18" y="15" width="3" height="1"/>
                      <rect x="1" y="16" width="1" height="2"/><rect x="3" y="16" width="3" height="1"/><rect x="7" y="16" width="1" height="2"/><rect x="9" y="16" width="1" height="2"/><rect x="13" y="16" width="1" height="2"/><rect x="16" y="16" width="1" height="2"/><rect x="18" y="16" width="3" height="1"/><rect x="21" y="16" width="1" height="2"/>
                      <rect x="1" y="17" width="1" height="1"/><rect x="7" y="17" width="1" height="1"/><rect x="9" y="17" width="1" height="1"/><rect x="13" y="17" width="1" height="1"/><rect x="16" y="17" width="1" height="1"/><rect x="21" y="17" width="1" height="1"/>
                      <rect x="1" y="18" width="1" height="2"/><rect x="3" y="18" width="3" height="1"/><rect x="7" y="18" width="1" height="2"/><rect x="9" y="18" width="1" height="2"/><rect x="13" y="18" width="2" height="1"/><rect x="17" y="18" width="1" height="1"/><rect x="18" y="18" width="1" height="1"/>
                      <rect x="3" y="19" width="3" height="1"/><rect x="13" y="19" width="1" height="1"/><rect x="18" y="19" width="1" height="1"/>
                      <rect x="1" y="20" width="1" height="2"/><rect x="2" y="20" width="5" height="1"/><rect x="7" y="20" width="1" height="2"/><rect x="9" y="20" width="1" height="1"/><rect x="13" y="20" width="1" height="2"/><rect x="19" y="20" width="1" height="2"/>
                      <rect x="9" y="21" width="2" height="1"/><rect x="12" y="21" width="1" height="1"/><rect x="13" y="21" width="2" height="1"/><rect x="19" y="21" width="2" height="1"/><rect x="21" y="21" width="1" height="1"/>
                      <rect x="0" y="22" width="25" height="1"/>
                    </g>
                  </svg>
                </div>
                <div className="mt-auto pt-4">
                  <span className="text-emerald-500">$</span><span className="inline-block w-2 h-4 bg-muted-foreground/50 animate-pulse ml-2"/>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-stretch">
            <div className="relative w-[260px] bg-white rounded-[36px] border-[3px] border-gray-300 shadow-2xl overflow-hidden flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-gray-900 rounded-b-xl z-10 border-b border-x border-gray-800"></div>
              <div className="flex flex-col h-[620px]">
                <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 px-3 pt-7">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-xs font-semibold text-gray-900 truncate">Fix auth middleware</span>
                    <span className="text-[10px] text-gray-500 truncate">myapp</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
                    <span className="text-[10px] text-gray-500">claude-sonnet</span>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden px-3 py-2 flex flex-col gap-2 bg-white">
                  <div className="max-w-[200px] bg-gray-100 rounded-2xl rounded-br-sm px-3 py-2 self-end">
                    <p className="text-[11px] text-gray-800 leading-relaxed text-left">The auth middleware is throwing 401 on valid tokens. Can you check the verify function?</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <span className="text-[10px] font-medium">read_file</span>
                      <span className="text-[9px] text-green-600 font-medium">done</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                      <code className="text-[10px] text-gray-600 font-mono">src/middleware/auth.ts</code>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed text-left">Found it. The <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">verify</code> function expects the token without the <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">Bearer</code> prefix, but the header includes it. Here&apos;s the fix:</p>
                    <div className="bg-gray-900 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] text-gray-400 font-mono">auth.ts</span>
                        <span className="text-[9px] text-green-400 font-mono ml-auto">+2 -1</span>
                      </div>
                      <pre className="text-[9px] text-gray-300 font-mono leading-relaxed overflow-hidden text-left"><code><span className="text-red-400">- const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+ const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+   ?.replace(&quot;Bearer &quot;, &quot;&quot;)</span></code></pre>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                    <span className="text-[10px] font-medium">todowrite</span>
                    <span className="text-[9px] text-green-600 font-medium">done</span>
                  </div>
                </div>
                <div className="px-3 pb-4 pt-1">
                  <div className="rounded-2xl bg-gray-100 p-2 border border-gray-200">
                    <div className="text-[10px] text-gray-400 px-1 pb-1 text-left">Ask anything...</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        </div>
                        <div className="px-1.5 py-0.5 rounded-full bg-gray-200">
                          <span className="text-[9px] text-gray-600 font-medium">build</span>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
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
