export function MockupStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pb-1 pt-5 text-[13px] font-semibold leading-none text-[#333333]/80">
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
  );
}
