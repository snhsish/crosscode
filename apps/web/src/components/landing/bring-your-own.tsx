import { Check } from "lucide-react";

const capabilities = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    ),
    title: "Approve tool calls",
    mockup: (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
          <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20"/>
        </div>
        <div className="flex gap-1.5">
          <div className="flex-1 rounded bg-emerald-500/20 border border-emerald-500/30 py-1 text-center text-[9px] font-medium text-emerald-600">Approve</div>
          <div className="flex-1 rounded bg-muted border py-1 text-center text-[9px] text-muted-foreground">Reject</div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    title: "Review diffs",
    mockup: (
      <div className="flex flex-col gap-1.5 font-mono text-[9px]">
        <div className="flex gap-1">
          <span className="text-red-500">-</span>
          <div className="h-1.5 flex-1 rounded-full bg-red-500/20"/>
        </div>
        <div className="flex gap-1">
          <span className="text-emerald-500">+</span>
          <div className="h-1.5 flex-1 rounded-full bg-emerald-500/20"/>
        </div>
        <div className="flex gap-1">
          <span className="text-emerald-500">+</span>
          <div className="h-1.5 w-2/3 rounded-full bg-emerald-500/20"/>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: "Manage sessions",
    mockup: (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"/>
          <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20"/>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500"/>
          <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/20"/>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"/>
          <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/10"/>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "Monitor progress",
    mockup: (
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-3/4 rounded-full bg-primary"/>
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>3/4 tools</span>
          <span>75%</span>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2-2 7h-7l5.5 4-2 7 5.5-4 5.5 4-2-7 5.5-4h-7z"/>
      </svg>
    ),
    title: "Switch contexts",
    mockup: (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 rounded bg-muted px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary"/>
          <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/30"/>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"/>
          <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/10"/>
        </div>
      </div>
    ),
  },
];

const benefits = [
  "No cloud dependency. Runs locally.",
  "Full control over your agent.",
  "Works with any OpenCode setup.",
];

export function BringYourOwn() {
  return (
    <section className="container py-20">
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
        Your own OpenCode
      </h2>
      <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
        CrossCode doesn&apos;t run your agent. Connect to the OpenCode instance already running on your machine. We stream the interface to your phone, you keep full control.
      </p>

      <div className="mt-12 rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {capabilities.map((cap, i) => (
            <div key={i} className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-foreground/70">
                  {cap.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{cap.title}</div>
                </div>
              </div>
              <div className="mt-auto">
                {cap.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
        {benefits.map((benefit, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
