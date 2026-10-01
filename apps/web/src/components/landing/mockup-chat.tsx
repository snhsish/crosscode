import {
  Check,
  ChevronDown,
  ChevronLeft,
  Cpu,
  EllipsisVertical,
  FileCode2,
  Loader2,
  Plus,
  Send,
} from "lucide-react";

type Token = { t: string; code?: boolean };

const MAIN_TOKENS: Token[] = [
  { t: "Found" },
  { t: "it" },
  { t: "—" },
  { t: "verify", code: true },
  { t: "expects" },
  { t: "the" },
  { t: "token" },
  { t: "without" },
  { t: "the" },
  { t: "Bearer", code: true },
  { t: "prefix," },
  { t: "but" },
  { t: "the" },
  { t: "handler" },
  { t: "forwards" },
  { t: "the" },
  { t: "raw" },
  { t: "header." },
  { t: "Adding" },
  { t: "normalization" },
  { t: "+" },
  { t: "retry:" },
];

const TAIL_TOKENS: Token[] = [
  { t: "Queued" },
  { t: "verification" },
  { t: "—" },
  { t: "retries" },
  { t: "with" },
  { t: "backoff" },
  { t: "(3" },
  { t: "attempts)" },
  { t: "+" },
  { t: "structured" },
  { t: "logs." },
  { t: "Approve" },
  { t: "to" },
  { t: "push." },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const remap = (v: number, a: number, b: number, c = 0, d = 1) =>
  c + (d - c) * clamp01((v - a) / (b - a));
const smooth = (v: number, a: number, b: number) => {
  const t = remap(v, a, b);
  return t * t * (3 - 2 * t);
};

function StreamWords({
  tokens,
  shown,
  streaming,
  small,
}: {
  tokens: Token[];
  shown: number;
  streaming: boolean;
  small?: boolean;
}) {
  return (
    <span>
      {tokens.slice(0, shown).map((tok, i, arr) => (
        <span key={i}>
          {tok.code ? (
            <code
              className={`rounded-md border border-[#e2e2e2] bg-[#f4f4f5] px-1.5 py-0.5 font-mono ${
                small ? "text-[11px]" : "text-[12px]"
              }`}
            >
              {tok.t}
            </code>
          ) : (
            tok.t
          )}
          {i < arr.length - 1 ? " " : ""}
          {streaming && i === arr.length - 1 && (
            <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-caret-blink bg-[#1a1a1a]" />
          )}
        </span>
      ))}
    </span>
  );
}

function ToolRow({
  label,
  file,
  done,
}: {
  label: string;
  file: string;
  done: boolean;
}) {
  return (
    <div className="flex animate-rise-in items-center gap-1.5">
      {done ? (
        <Check size={12} strokeWidth={3} className="shrink-0 text-green-600" />
      ) : (
        <Loader2 size={12} className="shrink-0 animate-spin text-[#8e8e8e]/60" />
      )}
      <span className="text-left text-[11px] text-[#8e8e8e]">
        {label}: <code className="font-mono text-[#333333]/80">{file}</code>
      </span>
    </div>
  );
}

function DiffCard() {
  return (
    <div className="animate-rise-in overflow-hidden rounded-xl border border-[#e2e2e2] bg-[#f4f4f5]/40">
      <div className="flex items-center gap-1.5 border-b border-[#e2e2e2]/70 px-3 py-2">
        <FileCode2 size={11} className="shrink-0 text-[#8e8e8e]" />
        <span className="font-mono text-[10px] text-[#8e8e8e]">stripe.ts</span>
        <span className="ml-auto font-mono text-[10px] text-green-600">+8 -2</span>
      </div>
      <pre className="overflow-hidden px-3 py-2 text-left font-mono text-[10px] leading-relaxed">
        <code>
          <span className="text-red-500">- const token = req.headers.auth</span>
          {"\n"}
          <span className="text-green-600">+ const token = req.headers.auth</span>
          {"\n"}
          <span className="text-green-600">+ ?.replace(&quot;Bearer &quot;, &quot;&quot;)</span>
          {"\n"}
          <span className="text-green-600">+ await withRetry(() =&gt; verify(token),</span>
          {"\n"}
          <span className="text-green-600">+ {"{ attempts: 3, backoff: true }"})</span>
        </code>
      </pre>
    </div>
  );
}

function TypingDots({ opacity }: { opacity: number }) {
  if (opacity <= 0.01) return null;
  return (
    <div className="flex justify-start" style={{ opacity }}>
      <div
        className="flex items-center rounded-full bg-[#f1f1f1] px-4 py-2.5"
        style={{
          gap: "calc(6px + 2px*(1 - var(--m, 1)))",
          paddingLeft: "calc(16px + 4px*(1 - var(--m, 1)))",
          paddingRight: "calc(16px + 4px*(1 - var(--m, 1)))",
        }}
        aria-label="Assistant is typing"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-typing-dot rounded-full bg-[#d4d4d4]"
            style={{
              width: "calc(8px + 2px*(1 - var(--m, 1)))",
              height: "calc(8px + 2px*(1 - var(--m, 1)))",
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatComposer() {
  return (
    <div
      style={{
        paddingLeft: "calc(12px + 4px*(1 - var(--m, 1)))",
        paddingRight: "calc(12px + 4px*(1 - var(--m, 1)))",
        paddingBottom: "calc(16px + 0px*(1 - var(--m, 1)))",
        paddingTop: "calc(8px + 0px*(1 - var(--m, 1)))",
      }}
    >
      <div
        className="bg-[#f4f4f5]"
        style={{ borderRadius: "calc(22px + 0px*(1 - var(--m, 1)))", padding: 10 }}
      >
        <p
          className="px-2 pb-2 pt-1 text-left text-[#8e8e8e]"
          style={{ fontSize: "calc(13px + 1px*(1 - var(--m, 1)))" }}
        >
          Ask anything...
        </p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e2e2e2] bg-white text-[#333333]/80 transition-colors hover:border-[#d7d7d7]"
            >
              <Plus size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[#e2e2e2] bg-white px-2.5 py-[5px] text-[11px] font-medium capitalize leading-none text-[#333333]/80 transition-colors hover:border-[#d7d7d7]"
            >
              Build
              <ChevronDown size={12} className="shrink-0 text-[#8e8e8e]" />
            </button>
            <button
              type="button"
              className="flex min-w-0 max-w-[140px] cursor-pointer items-center gap-1 rounded-full border border-[#e2e2e2] bg-white px-2.5 py-[5px] text-[11px] font-medium leading-none text-[#8e8e8e] transition-colors hover:border-[#d7d7d7]"
            >
              <Cpu size={12} className="shrink-0 text-[#8e8e8e]" />
              <span className="min-w-0 flex-1 truncate">claude-sonnet-4</span>
              <ChevronDown size={12} className="shrink-0 text-[#8e8e8e]" />
            </button>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d1d1d]">
            <Send size={15} className="text-white" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function MockupChatView({ streamT = 1 }: { streamT?: number }) {
  const s = clamp01(streamT);
  const showRead = s > 0.02;
  const readDone = s > 0.14;
  const mainShown = Math.floor(remap(s, 0.08, 0.52, 0, MAIN_TOKENS.length + 0.999));
  const showDiff = s > 0.52;
  const showTodo = s > 0.6;
  const todoDone = s > 0.8;
  const tailShown = Math.floor(remap(s, 0.66, 0.93, 0, TAIL_TOKENS.length + 0.999));
  const streaming = s > 0.02 && s < 0.995;
  const dotsOpacity = 1 - smooth(s, 0.86, 0.995);
  const mainStreaming = streaming && mainShown > 0 && mainShown < MAIN_TOKENS.length;
  const tailStreaming =
    streaming && tailShown > 0 && tailShown < TAIL_TOKENS.length && mainShown >= MAIN_TOKENS.length;

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className="flex items-center justify-between font-semibold leading-none text-[#333333]/80"
        style={{
          paddingLeft: "calc(24px + 16px*(1 - var(--m, 1)))",
          paddingRight: "calc(24px + 16px*(1 - var(--m, 1)))",
          paddingTop: "calc(20px + 8px*(1 - var(--m, 1)))",
          paddingBottom: "calc(4px + 2px*(1 - var(--m, 1)))",
          fontSize: "calc(13px + 4px*(1 - var(--m, 1)))",
        }}
      >
        <span className="tracking-wide">9:41</span>
        <div className="flex items-center gap-1.5">
          <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
            <rect x="0" y="7" width="3" height="4" rx="0.5" />
            <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" />
            <rect x="9" y="2" width="3" height="9" rx="0.5" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M2 6.5C7.5 1.5 16.5 1.5 22 6.5" />
            <path d="M5.5 10.5c4-3.5 9-3.5 13 0" />
            <circle cx="12" cy="15" r="1" fill="currentColor" />
          </svg>
          <svg width="24" height="12" viewBox="0 0 25 12" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
            <path d="M23 4v4c1-.3 1.5-1 1.5-2S24 4.3 23 4z" fill="currentColor" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div
        className="flex items-center border-b border-[#c9c9c9]"
        style={{
          gap: "calc(2px + 6px*(1 - var(--m, 1)))",
          paddingLeft: "calc(8px + 16px*(1 - var(--m, 1)))",
          paddingRight: "calc(8px + 16px*(1 - var(--m, 1)))",
          paddingTop: "calc(12px + 4px*(1 - var(--m, 1)))",
          paddingBottom: "calc(12px + 4px*(1 - var(--m, 1)))",
        }}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <ChevronLeft size={24} strokeWidth={2} />
        </span>
        <h3
          className="ml-1 min-w-0 flex-1 truncate text-left font-medium leading-none tracking-[-0.01em] text-[#333333]/80"
          style={{ fontSize: "calc(17px + 7px*(1 - var(--m, 1)))" }}
        >
          Implement webhook retries
        </h3>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <EllipsisVertical size={19} strokeWidth={2} />
        </span>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          gap: "calc(12px + 4px*(1 - var(--m, 1)))",
          paddingLeft: "calc(16px + 16px*(1 - var(--m, 1)))",
          paddingRight: "calc(16px + 16px*(1 - var(--m, 1)))",
          paddingTop: "calc(16px + 8px*(1 - var(--m, 1)))",
        }}
      >
        <div className="flex shrink-0 justify-end">
          <div
            className="border border-[#d7d7d7] bg-white"
            style={{
              maxWidth: "calc(88% - 23%*(1 - var(--m, 1)))",
              borderRadius: "calc(18px + 2px*(1 - var(--m, 1)))",
              paddingLeft: "calc(16px + 4px*(1 - var(--m, 1)))",
              paddingRight: "calc(16px + 4px*(1 - var(--m, 1)))",
              paddingTop: "calc(12px + 4px*(1 - var(--m, 1)))",
              paddingBottom: "calc(12px + 4px*(1 - var(--m, 1)))",
            }}
          >
            <p
              className="font-normal leading-[1.5] tracking-[-0.005em] text-[#1a1a1a]"
              style={{ fontSize: "calc(14px + 3px*(1 - var(--m, 1)))" }}
            >
              Stripe webhooks timeout under load. Add exponential retry + structured logging.
            </p>
          </div>
        </div>

        {showRead && (
          <ToolRow label="Read file" file="src/webhooks/stripe.ts" done={readDone} />
        )}

        {mainShown > 0 && (
          <p
            className="shrink-0 text-left font-normal leading-[1.6] text-[#333333]"
            style={{ fontSize: "calc(14px + 1px*(1 - var(--m, 1)))", maxWidth: "95%" }}
          >
            <StreamWords tokens={MAIN_TOKENS} shown={mainShown} streaming={mainStreaming} />
          </p>
        )}

        {showDiff && <DiffCard />}

        {showTodo && (
          <div className="flex shrink-0 items-center gap-1.5">
            {todoDone ? (
              <Check size={12} strokeWidth={3} className="shrink-0 text-green-600" />
            ) : (
              <Loader2 size={12} className="shrink-0 animate-spin text-[#8e8e8e]/60" />
            )}
            <span className="font-mono text-[11px] font-medium text-[#8e8e8e]">todowrite</span>
            <span
              className={`text-[10px] font-medium ${todoDone ? "text-green-600" : "text-[#8e8e8e]/70"}`}
            >
              {todoDone ? "done" : "running"}
            </span>
          </div>
        )}

        {tailShown > 0 && (
          <p
            className="shrink-0 text-left font-normal leading-[1.6] text-[#333333]"
            style={{ fontSize: "calc(14px + 1px*(1 - var(--m, 1)))" }}
          >
            <StreamWords tokens={TAIL_TOKENS} shown={tailShown} streaming={tailStreaming} small />
          </p>
        )}

        <TypingDots opacity={dotsOpacity} />
      </div>

      <div
        style={{
          maxHeight: "calc(var(--m, 1) * 220px)",
          opacity: "calc(var(--m, 1))",
          overflow: "hidden",
        }}
      >
        <ChatComposer />
      </div>
    </div>
  );
}
