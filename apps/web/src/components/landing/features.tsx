"use client"

import {
  QrCode,
  MessageSquare,
  GitBranch,
  Shield,
  Bell,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Connect",
    description: "Scan and connect in one tap. No copy-pasting URLs or manual configuration.",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Stream responses live with full markdown and code block rendering.",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    icon: GitBranch,
    title: "Inline Diffs",
    description: "See exactly what the agent changed before it happens with side-by-side view.",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: Shield,
    title: "Tool Approvals",
    description: "Approve or reject every shell command, file write, or API call before it runs.",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    description: "Get notified when the agent finishes, needs approval, or hits an error.",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    icon: Smartphone,
    title: "Works Anywhere",
    description: "Mobile data, different WiFi, across the world. No shared network required.",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-500",
  },
];

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const Icon = feature.icon;

  return (
    <div className="h-full">
      <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 overflow-hidden">
        <div className="flex flex-col gap-4 h-full">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg} border border-border/50 shadow-lg`}>
            <Icon className={`h-7 w-7 ${feature.iconColor}`} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
          </div>

          <div className="mt-2 rounded-lg border border-border/30 bg-background/50 p-3 h-28 flex items-center justify-center">
            {feature.title === "QR Connect" && (
              <svg viewBox="0 0 200 120" className="h-full w-auto" fill="none">
                <rect x="60" y="20" width="80" height="80" rx="8" stroke="currentColor" strokeWidth="2" className="text-blue-500/40" />
                <rect x="70" y="30" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
                <rect x="110" y="30" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
                <rect x="70" y="70" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
                <rect x="110" y="70" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
                <path d="M100 10 L100 20 M100 100 L100 110 M10 60 L20 60 M180 60 L190 60" stroke="currentColor" strokeWidth="2" className="text-blue-500/40" />
              </svg>
            )}
            {feature.title === "Real-time Chat" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-3/4 rounded bg-purple-500/30" />
                    <div className="h-2 w-1/2 rounded bg-purple-500/20" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-2/3 rounded bg-muted ml-auto" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-full rounded bg-purple-500/30" />
                    <div className="h-2 w-4/5 rounded bg-purple-500/20" />
                  </div>
                </div>
              </div>
            )}
            {feature.title === "Inline Diffs" && (
              <div className="space-y-1 font-mono text-xs">
                <div className="flex gap-2">
                  <span className="text-red-500/60">-</span>
                  <span className="text-muted-foreground line-through">const old = value</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500/60">+</span>
                  <span className="text-green-500/80">const new = updated</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground/40"> </span>
                  <span className="text-muted-foreground">return result</span>
                </div>
              </div>
            )}
            {feature.title === "Tool Approvals" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                  <span className="text-muted-foreground">npm install react</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 h-7 rounded bg-green-500/20 text-green-500 text-xs font-medium">Approve</button>
                  <button className="flex-1 h-7 rounded bg-red-500/20 text-red-500 text-xs font-medium">Reject</button>
                </div>
              </div>
            )}
            {feature.title === "Push Notifications" && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="h-4 w-4 rounded-full bg-rose-500/40 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-1/2 rounded bg-rose-500/40" />
                    <div className="h-2 w-3/4 rounded bg-rose-500/20" />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/30">
                  <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-2/3 rounded bg-muted" />
                    <div className="h-2 w-1/2 rounded bg-muted/60" />
                  </div>
                </div>
              </div>
            )}
            {feature.title === "Works Anywhere" && (
              <div className="flex items-center justify-center gap-4 py-2">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo-500/60" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
                <div className="space-y-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-500/40" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
                  </svg>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-500/60" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="container py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need</h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Full control over your AI coding agent from your phone
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
