import Link from "next/link";

export function DownloadIcon() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4.5 19 12 6 19.5v-15Z" />
        <path d="M6 4.5 19 12" />
      </svg>
    </span>
  );
}

export function HeroTitle() {
  return (
    <div className="text-center">
      <h1
        className="mx-auto font-medium leading-[1.08] tracking-[-0.02em] text-[#3f3f3f] text-[38px] sm:text-[60px] lg:text-[76px]"
        style={{ fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif" }}
      >
        Your{" "}
        <span className="relative inline-block whitespace-nowrap bg-[#d9e8fd] px-[10px]">
          OpenCode
          <span
            aria-hidden
            className="absolute -right-[2px] top-0 h-full w-[3px] bg-[#1f86ff]"
          />
          <span
            aria-hidden
            className="absolute -right-[8px] -top-[9px] h-[15px] w-[15px] rounded-full bg-[#1f86ff]"
          />
        </span>{" "}
        agent
        <br className="hidden sm:block" /> in your pocket.
      </h1>

      <div className="mt-8 flex justify-center sm:mt-10">
        <Link
          href="/download"
          className="flex items-center gap-4 rounded-[10px] bg-[#1d1d1d] py-2 pl-6 pr-2 text-[17px] font-medium text-white transition-colors hover:bg-black sm:text-[19px]"
        >
          Download for Android
          <DownloadIcon />
        </Link>
      </div>
      <p className="mt-3 text-[14px] font-normal tracking-[-0.01em] text-[#8e8e8e] sm:text-[16px]">
        App Store Release Soon
      </p>
    </div>
  );
}
