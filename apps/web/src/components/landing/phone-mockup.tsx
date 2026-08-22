"use client";

import { useEffect, useState } from "react";

const STEP_DELAYS_MS = [900, 1000, 1400, 1200, 300, 1600, 1100, 1000, 4500];
const LAST_STEP = STEP_DELAYS_MS.length - 1;

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 self-start rounded-2xl rounded-bl-sm bg-muted border border-border w-fit">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

function ToolRow({
  icon,
  name,
  done,
}: {
  icon: React.ReactNode;
  name: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      <span className="text-[10px] font-medium">{name}</span>
      {done ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400 animate-rise-in">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin text-muted-foreground/60">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      <span className={`text-[9px] font-medium ${done ? "text-green-600 dark:text-green-400" : "text-muted-foreground/70"}`}>
        {done ? "done" : "running"}
      </span>
    </div>
  );
}

export function PhoneMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(
      () => setStep((s) => (s + 1) % STEP_DELAYS_MS.length),
      STEP_DELAYS_MS[step]
    );
    return () => clearTimeout(timeout);
  }, [step]);

  return (
    <div className="relative flex-shrink-0 mx-auto lg:mx-0" style={{ width: 300 }}>
      {/* Side buttons */}
      <div className="absolute top-[130px] -left-[3px] w-[3px] h-8 rounded-l-sm bg-zinc-700 dark:bg-zinc-600" />
      <div className="absolute top-[185px] -left-[3px] w-[3px] h-14 rounded-l-sm bg-zinc-700 dark:bg-zinc-600" />
      <div className="absolute top-[200px] -right-[3px] w-[3px] h-20 rounded-r-sm bg-zinc-700 dark:bg-zinc-600" />

      {/* Device frame */}
      <div className="w-full rounded-[3rem] bg-zinc-900 border border-zinc-800 shadow-2xl p-[10px] dark:bg-zinc-950 dark:border-zinc-800">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-background flex flex-col" style={{ height: 610 }}>
          {/* Dynamic island */}
          <div className="absolute top-[9px] left-1/2 -translate-x-1/2 z-20 h-[24px] w-[92px] rounded-full bg-black" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-8 pt-3 text-[11px] font-semibold text-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="10" viewBox="0 0 16 12" fill="currentColor">
                <rect x="0" y="7" width="3" height="4" rx="0.5" />
                <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" />
                <rect x="9" y="2" width="3" height="9" rx="0.5" />
              </svg>
              <svg width="14" height="10" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M2 6.5C7.5 1.5 16.5 1.5 22 6.5" />
                <path d="M5.5 10.5c4-3.5 9-3.5 13 0" />
                <circle cx="12" cy="15" r="1" fill="currentColor" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 25 12" fill="none">
                <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
                <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
                <path d="M23 4v4c1-.3 1.5-1 1.5-2S24 4.3 23 4z" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center gap-2 border-b border-border pb-2.5 px-4 pt-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground shrink-0"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            <div className="flex flex-col min-w-0 flex-1 pl-0.5 text-left">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">Fix auth middleware</span>
              <span className="text-[10px] text-muted-foreground truncate">myapp</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap leading-none">claude-sonnet</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden px-4 py-3 flex flex-col gap-2.5">
            {step >= 1 && (
              <div className="max-w-[85%] bg-secondary rounded-2xl rounded-br-sm px-3.5 py-2.5 self-end border border-border animate-rise-in">
                <p className="text-[11px] text-secondary-foreground leading-relaxed text-left">
                  The auth middleware is throwing 401 on valid tokens. Can you check the verify function?
                </p>
              </div>
            )}
            {step === 2 && (
              <div className="animate-rise-in">
                <TypingDots />
              </div>
            )}
            {step >= 3 && (
              <div className="flex flex-col gap-2">
                {step >= 3 && (
                  <div className="animate-rise-in">
                    <ToolRow
                      done={step >= 4}
                      name="read_file"
                      icon={
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                      }
                    />
                  </div>
                )}
                {step >= 4 && (
                  <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 w-fit animate-rise-in">
                    <code className="text-[10px] text-muted-foreground font-mono">src/middleware/auth.ts</code>
                  </div>
                )}
              </div>
            )}
            {step >= 5 && (
              <p className="text-[11px] text-foreground leading-relaxed text-left animate-rise-in">
                Found it. The <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">verify</code>{" "}
                function expects the token without the{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">Bearer</code> prefix, but the
                header includes it. Here&apos;s the fix:
              </p>
            )}
            {step >= 6 && (
              <div className="bg-zinc-900 dark:bg-zinc-900 rounded-lg p-2.5 border border-zinc-800 animate-rise-in">
                <div className="flex items-center gap-1 mb-1.5">
                  <span className="text-[9px] text-zinc-400 font-mono">auth.ts</span>
                  <span className="text-[9px] text-green-400 font-mono ml-auto">+2 -1</span>
                </div>
                <pre className="text-[9px] text-zinc-300 font-mono leading-relaxed overflow-hidden text-left"><code><span className="text-red-400">- const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+ const token = req.headers.auth</span>{"\n"}<span className="text-green-400">+   ?.replace(&quot;Bearer &quot;, &quot;&quot;)</span></code></pre>
              </div>
            )}
            {step >= 7 && (
              <div className="animate-rise-in">
                <ToolRow
                  done={step >= 8}
                  name="todowrite"
                  icon={
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6"/></svg>
                  }
                />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-4 pb-4 pt-1">
            <div className="rounded-2xl bg-muted p-2.5 border border-border">
              <div className="text-[10px] text-muted-foreground px-0.5 pb-1.5 text-left">Ask anything...</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-background border border-border">
                    <span className="text-[9px] text-muted-foreground font-medium leading-none">build</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
