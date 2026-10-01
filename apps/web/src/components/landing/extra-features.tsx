import {
  ArrowLeft,
  AudioLines,
  Bell,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  FileText,
  Filter,
  Folder,
  GitBranch,
  GitCommitHorizontal,
  Image as ImageIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Type,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";

function CardShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] border border-[#e9e9e9] bg-[#f7f7f7]">
      <div className="m-3 mb-0 flex min-h-[340px] flex-1 flex-col justify-center overflow-hidden rounded-[20px] border border-[#ececec] bg-white p-5 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] sm:min-h-[360px]">
        {children}
      </div>
      <div className="px-7 pb-7 pt-5 text-left">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-neutral-900">
          {title}
        </h3>
        <p className="mt-1.5 text-[15px] leading-[1.6] text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function PushNotificationsMockup() {
  return (
    <div className="mx-auto flex w-full max-w-[360px] flex-col gap-2.5">
      <div className="overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 px-3.5 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[#1d1d1d]">
            <Bell size={12} className="text-white" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#8e8e8e]">
            CrossCode · now
          </span>
        </div>
        <p className="px-3.5 pt-1.5 text-left text-[13.5px] font-semibold text-[#1a1a1a]">
          Agent finished
        </p>
        <p className="px-3.5 pb-3 text-left text-[12.5px] leading-snug text-[#666]">
          Implement webhook retries is ready for review.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 px-3.5 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-amber-500/15">
            <ShieldCheck size={13} className="text-amber-600" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#8e8e8e]">
            CrossCode · permission
          </span>
        </div>
        <p className="px-3.5 pt-1.5 text-left font-mono text-[12px] text-[#1a1a1a]">
          npm run migrate
        </p>
        <div className="flex gap-2 px-3.5 pb-3.5 pt-2.5">
          <span className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#1d1d1d] py-1.5 text-[12px] font-medium text-white">
            <Check size={12} /> Approve
          </span>
          <span className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#f1f1f1] py-1.5 text-[12px] font-medium text-[#555]">
            <X size={12} /> Deny
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 px-3.5 pt-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-blue-500/15">
            <CircleHelp size={13} className="text-blue-600" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#8e8e8e]">
            CrossCode · question
          </span>
        </div>
        <p className="px-3.5 pb-3.5 pt-1.5 text-left text-[12.5px] leading-snug text-[#333]">
          Agent asked: “Which API version should I target?”
        </p>
      </div>
    </div>
  );
}

function SavedPromptsMockup() {
  const prompts = [
    { label: "Fix lint errors in auth module", saved: true },
    { label: "Summarise this PR", saved: false },
    { label: "Write tests for webhook retry", saved: false },
    { label: "Explain this error", saved: false },
    { label: "Draft release notes", saved: false },
  ];
  return (
    <div className="mx-auto flex w-full max-w-[360px] flex-col">
      <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-[#f7f7f7] py-2 pl-4 pr-2">
        <Sparkles size={14} className="shrink-0 text-[#8e8e8e]" />
        <span className="min-w-0 flex-1 truncate text-left text-[13.5px] text-[#1a1a1a]">
          Fix lint errors in auth module
          <span className="ml-1 inline-block h-[14px] w-[1.5px] translate-y-[2px] animate-caret-blink bg-[#1a1a1a]" />
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#666] shadow-sm ring-1 ring-[#e4e4e4]">
          <Bookmark size={11} /> Saved
        </span>
      </div>
      <div className="mt-2 flex flex-col">
        {prompts.map((p, i) => (
          <div
            key={p.label}
            className="flex items-center gap-2 border-b border-[#f1f1f1] py-2.5 last:border-0"
            style={{ opacity: 1 - i * 0.18 }}
          >
            <Bookmark
              size={13}
              className={p.saved ? "text-[#1a1a1a]" : "text-[#c9c9c9]"}
              fill={p.saved ? "currentColor" : "none"}
            />
            <span className="min-w-0 flex-1 truncate text-left text-[13.5px] text-[#333]">
              {p.label}
            </span>
            <ChevronRight size={13} className="shrink-0 text-[#c9c9c9]" />
          </div>
        ))}
      </div>
    </div>
  );
}

type Capability = "text" | "image" | "audio" | "video" | "pdf";

const CAPABILITY_ICONS: Record<Capability, LucideIcon> = {
  text: Type,
  image: ImageIcon,
  audio: AudioLines,
  video: Video,
  pdf: FileText,
};

type PickerModel = {
  name: string;
  provider: string;
  family?: string;
  variants?: number;
  status: "active" | "beta" | "alpha" | "deprecated";
  selected?: boolean;
  capabilities: Capability[];
};

const PICKER_MODELS: PickerModel[] = [
  {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    status: "beta",
    selected: true,
    capabilities: ["text", "image", "audio", "video", "pdf"],
  },
  {
    name: "GPT-5",
    provider: "OpenAI",
    family: "gpt",
    variants: 2,
    status: "active",
    capabilities: ["text", "image", "audio", "pdf"],
  },
  {
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    status: "active",
    capabilities: ["text", "image", "pdf"],
  },
];

const PICKER_STATUS_STYLES: Record<PickerModel["status"], string> = {
  active: "bg-green-500/15 text-green-600",
  beta: "bg-yellow-500/15 text-yellow-600",
  alpha: "bg-orange-500/15 text-orange-600",
  deprecated: "bg-red-500/15 text-red-500",
};

function ModelPickerMockup() {
  return (
    <div className="mx-auto flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-[#e4e4e4] bg-white">
      <div className="flex items-center gap-0.5 border-b border-[#ececec] px-2 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <ArrowLeft size={16} strokeWidth={2} />
        </span>
        <p className="ml-1 min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-[#333333]/80">
          Select Model
        </p>
        <span className="max-w-[150px] shrink-0 truncate rounded-full border border-[#d7d7d7] bg-[#f4f4f5] px-2 py-1 text-[9px] text-[#8e8e8e]">
          Google / gemini-2-5-pro
        </span>
      </div>

      <div className="px-3 pt-2.5">
        <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-3 py-2">
          <Search size={12} className="shrink-0 text-[#8e8e8e]" />
          <span className="text-[11.5px] text-[#a3a3a3]">Search models...</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 px-3 pt-2">
        <Filter size={10} className="text-[#8e8e8e]" />
        <span className="mr-0.5 text-[10px] text-[#8e8e8e]">Filter:</span>
        {[
          { label: "Active", active: false },
          { label: "Beta", active: true },
          { label: "Alpha", active: false },
          { label: "All", active: false },
        ].map(({ label, active }) => (
          <span
            key={label}
            className={`rounded-full border px-1.5 py-0.5 text-[9px] ${
              active
                ? "border-yellow-500/30 bg-yellow-500/15 font-medium text-yellow-600"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1 px-3 pt-1">
        <SlidersHorizontal size={10} className="text-[#8e8e8e]" />
        <span className="mr-0.5 text-[10px] text-[#8e8e8e]">Sort:</span>
        {["Name", "Provider", "Status"].map((label) => (
          <span
            key={label}
            className={`rounded-full border px-1.5 py-0.5 text-[9px] ${
              label === "Name"
                ? "border-[#1a1a1a] bg-[#1a1a1a]/5 font-medium text-[#1a1a1a]"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
        <span className="ml-auto text-[9px] text-[#8e8e8e]">3 models</span>
      </div>

      <div className="mt-2 border-t border-[#e4e4e4]/70">
        {PICKER_MODELS.map((m) => (
          <div
            key={m.name}
            className={`flex items-center border-b border-[#f1f1f1] px-3.5 py-2.5 last:border-0 ${
              m.selected ? "bg-[#f4f4f5]/70" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-left text-[12px] font-medium text-[#1a1a1a]">
                  {m.name}
                </p>
                {m.selected && <Check size={12} className="shrink-0 text-[#1a1a1a]" />}
              </div>
              <p className="mt-0.5 text-left text-[10px] text-[#8e8e8e]">
                {m.provider}
                {m.family ? ` · ${m.family}` : ""}
              </p>
              {m.variants ? (
                <p className="mt-0.5 text-left text-[10px] text-[#8e8e8e]">
                  {m.variants} variants
                </p>
              ) : null}
              <div className="mt-1 flex items-center gap-1.5">
                {m.capabilities.map((cap) => {
                  const CapIcon = CAPABILITY_ICONS[cap];
                  return <CapIcon key={cap} size={10} className="text-[#8e8e8e]/60" />;
                })}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize ${PICKER_STATUS_STYLES[m.status]}`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExploreMockup() {
  const files = [
    { name: "src", folder: true, depth: 0 },
    { name: "webhooks", folder: true, depth: 1 },
    { name: "stripe.ts", folder: false, depth: 2, active: true },
    { name: "retry.ts", folder: false, depth: 2 },
    { name: "api", folder: true, depth: 1 },
  ];
  const commits = [
    { msg: "Add retry with backoff", branch: "main", active: true },
    { msg: "Normalize bearer token", branch: "main", active: false },
    { msg: "Fix webhook timeout", branch: "fix/auth", active: false },
  ];
  return (
    <div className="mx-auto grid w-full max-w-[380px] grid-cols-[1fr_1.1fr] overflow-hidden rounded-2xl border border-[#e4e4e4]">
      <div className="border-r border-[#ececec] bg-[#fafafa] p-3">
        <div className="flex items-center gap-1.5 pb-2">
          <Folder size={12} className="text-[#8e8e8e]" />
          <span className="text-[11px] font-medium text-[#666]">crosscode</span>
        </div>
        {files.map((f) => (
          <div
            key={f.name}
            className={`flex items-center gap-1.5 rounded-md px-1.5 py-1.5 ${
              f.active ? "bg-[#1d1d1d] text-white" : "text-[#555]"
            }`}
            style={{ marginLeft: f.depth * 10 }}
          >
            {f.folder ? (
              <Folder size={11} className={f.active ? "text-white" : "text-[#8e8e8e]"} />
            ) : (
              <FileText size={11} className={f.active ? "text-white" : "text-[#8e8e8e]"} />
            )}
            <span className={`truncate font-mono text-[11px] ${f.folder ? "font-semibold" : ""}`}>
              {f.name}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-white p-3">
        <div className="flex items-center gap-1.5 pb-2">
          <GitBranch size={12} className="text-[#8e8e8e]" />
          <span className="text-[11px] font-medium text-[#666]">git graph</span>
        </div>
        <div className="relative flex flex-col">
          <span className="absolute bottom-3 left-[7px] top-3 w-[2px] rounded bg-[#e4e4e4]" aria-hidden />
          {commits.map((c) => (
            <div key={c.msg} className="relative flex gap-2 py-1.5">
              <span
                className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                  c.active ? "border-[#1d1d1d]" : "border-[#c9c9c9]"
                }`}
              >
                <GitCommitHorizontal size={9} className={c.active ? "text-[#1d1d1d]" : "text-[#a3a3a3]"} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-left text-[11.5px] font-medium text-[#1a1a1a]">{c.msg}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 font-mono text-[9.5px] ${
                    c.branch === "main"
                      ? "bg-green-500/15 text-green-700"
                      : "bg-blue-500/15 text-blue-700"
                  }`}
                >
                  {c.branch}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExtraFeatures() {
  return (
    <section className="bg-white px-6 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-neutral-900">
            Additional features
          </p>
          <h2
            className="mx-auto mt-3 font-medium leading-[1.08] tracking-[-0.025em] text-neutral-900 text-[32px] sm:text-[44px]"
            style={{ fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif" }}
          >
            Everything you need, on the go.
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-[15px] leading-[1.6] text-neutral-500 sm:text-[16px]">
            CrossCode mirrors your OpenCode setup, with thoughtful mobile-native
            tools that keep you in flow wherever you are.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <CardShell
            title="Push notifications"
            description="Stay updated when your agent finishes, asks a question, or needs approval. Tap a notification to jump straight back into the session."
          >
            <PushNotificationsMockup />
          </CardShell>

          <CardShell
            title="Quick prompts"
            description="Save your go-to instructions as quick prompts and reuse them in one tap. Skip retyping the same fix, test, or review prompt."
          >
            <SavedPromptsMockup />
          </CardShell>

          <CardShell
            title="Model picker with capabilities"
            description="See at a glance what each model supports, from text and images to files, audio, and video, then switch mid-session without losing context."
          >
            <ModelPickerMockup />
          </CardShell>

          <CardShell
            title="Browse code and git graph"
            description="Explore files and follow branches, commits, and diffs visually, with full codebase context right from your phone."
          >
            <ExploreMockup />
          </CardShell>
        </div>
      </div>
    </section>
  );
}
