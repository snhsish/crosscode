import { ChevronLeft, ChevronDown, Cpu, EllipsisVertical, Plus, Send } from "lucide-react";
import { MockupStatusBar } from "@/components/landing/mockup-statusbar";

function ChatComposer() {
  return (
    <div className="px-3 pb-4 pt-2">
      <div className="rounded-[22px] bg-[#f4f4f5] p-2.5">
        <p className="px-2 pb-2 pt-1 text-left text-[13px] text-[#8e8e8e]">
          Ask anything...
        </p>
        <div className="flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
              <Plus size={18} strokeWidth={2} />
            </span>
            <span className="shrink-0 rounded-full border border-[#d7d7d7] bg-white px-2 py-1 text-[10px] font-medium capitalize text-[#333333]/80">
              Build
            </span>
            <span className="flex min-w-0 items-center gap-1 rounded-md border border-[#d7d7d7] bg-white px-1.5 py-1">
              <Cpu size={11} className="shrink-0 text-[#8e8e8e]" />
              <span className="truncate text-[10px] text-[#8e8e8e]">
                claude-sonnet-4
              </span>
              <ChevronDown size={10} className="shrink-0 text-[#8e8e8e]" />
            </span>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d1d1d]">
            <Send size={15} className="text-white" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function MockupChatView() {
  return (
    <div className="flex h-full flex-col bg-white">
      <MockupStatusBar />

      {/* Header */}
      <div className="flex items-center gap-0.5 border-b border-[#c9c9c9] px-2 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <ChevronLeft size={24} strokeWidth={2} />
        </span>
        <h3 className="ml-1 min-w-0 flex-1 truncate text-left text-[17px] font-medium leading-none tracking-[-0.01em] text-[#333333]/80">
          Implement webhook retries
        </h3>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <EllipsisVertical size={19} strokeWidth={2} />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pt-4">
        <div className="flex justify-end">
          <div className="max-w-[88%] rounded-[18px] border border-[#d7d7d7] bg-white px-4 py-3">
            <p className="text-[14px] font-normal leading-[1.5] tracking-[-0.005em] text-[#1a1a1a]">
              Stripe webhooks timeout under load. Add exponential retry + structured logging.
            </p>
          </div>
        </div>

        <p className="max-w-[95%] text-left text-[14px] font-normal leading-[1.6] text-[#333333]">
          Found it — <code className="rounded-md border border-[#e2e2e2] bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[12px]">verify</code> expects
          the token without the <code className="rounded-md border border-[#e2e2e2] bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[12px]">Bearer</code> prefix.
          Pushing a fix now.
        </p>

        <div className="flex justify-start">
          <div
            className="flex items-center gap-1.5 rounded-full bg-[#f1f1f1] px-4 py-2.5"
            aria-label="Assistant is typing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-typing-dot rounded-full bg-[#d4d4d4]"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <ChatComposer />
    </div>
  );
}
