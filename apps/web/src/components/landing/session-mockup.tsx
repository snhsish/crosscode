import { ChevronLeft, EllipsisVertical } from "lucide-react";

export function SessionMockup() {
  return (
    <div
      id="session-mockup"
      className="relative mx-auto h-[340px] w-full max-w-[560px] overflow-hidden rounded-t-[36px] border-[2px] border-b-0 border-[#c9c9c9] bg-white sm:h-[410px] sm:max-w-[620px] sm:rounded-t-[64px]"
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-7 pb-1.5 pt-6 text-[15px] font-semibold leading-none text-[#333333]/80 sm:px-10 sm:pt-7 sm:text-[17px]">
        <span className="tracking-wide">9:41</span>
        <div className="flex items-center gap-2">
          <svg width="19" height="13" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
            <rect x="0" y="7" width="3" height="4" rx="0.5" />
            <rect x="4.5" y="4.5" width="3" height="6.5" rx="0.5" />
            <rect x="9" y="2" width="3" height="9" rx="0.5" />
          </svg>
          <svg width="19" height="13" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M2 6.5C7.5 1.5 16.5 1.5 22 6.5" />
            <path d="M5.5 10.5c4-3.5 9-3.5 13 0" />
            <circle cx="12" cy="15" r="1" fill="currentColor" />
          </svg>
          <svg width="29" height="14" viewBox="0 0 25 12" fill="none" aria-hidden>
            <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
            <path d="M23 4v4c1-.3 1.5-1 1.5-2S24 4.3 23 4z" fill="currentColor" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-1 border-b border-[#c9c9c9] px-3 py-4 sm:gap-2 sm:px-6 sm:py-5">
        <button
          type="button"
          aria-label="Back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#333333]/80 transition-colors hover:bg-black/[0.06]"
        >
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <h3 className="ml-2 min-w-0 flex-1 truncate text-left text-[19px] font-medium leading-none tracking-[-0.01em] text-[#333333]/80 sm:ml-3 sm:text-[26px]">
          Implement webhook retries
        </h3>
        <button
          type="button"
          aria-label="Session menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#333333]/80 transition-colors hover:bg-black/[0.06]"
        >
          <EllipsisVertical size={22} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-4 pb-10 pt-6 sm:gap-7 sm:px-8 sm:pt-9">
        {/* User bubble — right aligned */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[20px] border border-[#d7d7d7] bg-white px-5 py-4 sm:max-w-[65%] sm:px-6 sm:py-5">
            <p className="text-[15px] font-normal leading-[1.45] tracking-[-0.005em] text-[#1a1a1a] sm:text-[19px]">
              Stripe webhooks timeout under load. Add exponential retry + structured logging.
            </p>
          </div>
        </div>

        {/* Typing indicator — left aligned */}
        <div className="flex justify-start">
          <div
            className="flex items-center gap-2 rounded-full bg-[#f1f1f1] px-5 py-3"
            aria-label="Assistant is typing"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-typing-dot rounded-full bg-[#d4d4d4] sm:h-3 sm:w-3"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
