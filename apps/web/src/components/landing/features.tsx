"use client"

import { useEffect, useState } from "react";
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

function QRConnectMockup() {
  const [phase, setPhase] = useState<"qr" | "scanning" | "success">("qr");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p === "qr" ? "scanning" : p === "scanning" ? "success" : "qr"));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {phase !== "success" ? (
        <svg viewBox="0 0 200 120" className="h-full w-auto" fill="none">
          <rect x="60" y="20" width="80" height="80" rx="8" stroke="currentColor" strokeWidth="2" className="text-blue-500/40" />
          <rect x="70" y="30" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
          <rect x="110" y="30" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
          <rect x="70" y="70" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
          <rect x="110" y="70" width="20" height="20" rx="2" fill="currentColor" className="text-blue-500/60" />
          {phase === "scanning" && (
            <rect x="60" y="20" width="80" height="3" fill="currentColor" className="text-blue-500 animate-scan-line" />
          )}
        </svg>
      ) : (
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center animate-scale-in">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" className="animate-draw-check" />
            </svg>
          </div>
          <span className="text-xs text-green-500 font-medium">Connected</span>
        </div>
      )}
    </div>
  );
}

function RealtimeChatMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className={`flex gap-2 transition-all duration-500 ${step >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="h-6 w-6 rounded-full bg-purple-500/20 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-2 w-3/4 rounded bg-purple-500/30" />
          <div className="h-2 w-1/2 rounded bg-purple-500/20" />
        </div>
      </div>
      <div className={`flex gap-2 justify-end transition-all duration-500 ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="flex-1 space-y-1">
          <div className="h-2 w-2/3 rounded bg-muted ml-auto" />
        </div>
      </div>
      <div className={`flex gap-2 transition-all duration-500 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="h-6 w-6 rounded-full bg-purple-500/20 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className={`h-2 rounded bg-purple-500/30 transition-all duration-1000 ${step >= 2 ? "w-full" : "w-0"}`} />
          <div className={`h-2 rounded bg-purple-500/20 transition-all duration-1000 delay-300 ${step >= 3 ? "w-4/5" : "w-0"}`} />
          {step === 2 && (
            <div className="flex gap-1 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineDiffsMockup() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((v) => (v + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-1 font-mono text-xs">
      <div className={`flex gap-2 transition-all duration-500 ${visibleLines >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
        <span className="text-red-500/60">-</span>
        <span className="text-muted-foreground line-through">const old = value</span>
      </div>
      <div className={`flex gap-2 transition-all duration-500 delay-200 ${visibleLines >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
        <span className="text-green-500/60">+</span>
        <span className="text-green-500/80 bg-green-500/10 px-1 rounded animate-highlight">const new = updated</span>
      </div>
      <div className={`flex gap-2 transition-all duration-500 delay-400 ${visibleLines >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}>
        <span className="text-muted-foreground/40"> </span>
        <span className="text-muted-foreground">return result</span>
      </div>
    </div>
  );
}

function ToolApprovalsMockup() {
  const [phase, setPhase] = useState<"waiting" | "approved" | "rejected">("waiting");

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p === "waiting" ? "approved" : p === "approved" ? "rejected" : "waiting"));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <div className={`h-2 w-2 rounded-full transition-all duration-300 ${phase === "waiting" ? "bg-amber-500/60 animate-pulse" : phase === "approved" ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-muted-foreground">npm install react</span>
      </div>
      <div className="flex gap-2">
        <button className={`flex-1 h-7 rounded text-xs font-medium transition-all duration-300 ${phase === "approved" ? "bg-emerald-100 text-emerald-600 scale-105" : "bg-emerald-50 text-emerald-500"}`}>
          {phase === "approved" ? "✓ Approved" : "Approve"}
        </button>
        <button className={`flex-1 h-7 rounded text-xs font-medium transition-all duration-300 ${phase === "rejected" ? "bg-rose-100 text-rose-600 scale-105" : "bg-rose-50 text-rose-500"}`}>
          {phase === "rejected" ? "✕ Rejected" : "Reject"}
        </button>
      </div>
    </div>
  );
}

function PushNotificationsMockup() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((v) => (v + 1) % 3);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-2">
      <div className={`flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 transition-all duration-500 ${visibleCount >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="h-4 w-4 rounded-full bg-rose-500/40 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="h-2 w-1/2 rounded bg-rose-500/40" />
          <div className="h-2 w-3/4 rounded bg-rose-500/20" />
        </div>
      </div>
      <div className={`flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border/30 transition-all duration-500 delay-200 ${visibleCount >= 2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="h-2 w-2/3 rounded bg-muted" />
          <div className="h-2 w-1/2 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

function WorksAnywhereMockup() {
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignalStrength((s) => (s + 1) % 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 py-2 w-full">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-indigo-500/60" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
      </svg>
      <div className="space-y-1">
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-all duration-300 ${signalStrength >= 1 ? "text-indigo-500/60 opacity-100" : "text-indigo-500/20 opacity-50"}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-all duration-300 ${signalStrength >= 2 ? "text-indigo-500/80 opacity-100" : "text-indigo-500/20 opacity-50"}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-all duration-300 ${signalStrength >= 3 ? "text-indigo-500 opacity-100" : "text-indigo-500/20 opacity-50"}`} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      </div>
    </div>
  );
}

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
            {feature.title === "QR Connect" && <QRConnectMockup />}
            {feature.title === "Real-time Chat" && <RealtimeChatMockup />}
            {feature.title === "Inline Diffs" && <InlineDiffsMockup />}
            {feature.title === "Tool Approvals" && <ToolApprovalsMockup />}
            {feature.title === "Push Notifications" && <PushNotificationsMockup />}
            {feature.title === "Works Anywhere" && <WorksAnywhereMockup />}
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
