import Image from "next/image";
import Link from "next/link";
import { SessionMockup } from "@/components/landing/session-mockup";

function DownloadIcon() {
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

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-68px)] flex-col overflow-hidden bg-white">
      <div className="relative z-10 mx-auto w-full max-w-[1100px] shrink-0 px-5 pt-16 text-center sm:px-6 sm:pt-20 lg:pt-24">
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

      {/* Wave + mockup — pinned to the bottom so the card is clipped by the viewport */}
      <div className="relative z-0 mt-8 flex flex-1 flex-col justify-end sm:mt-10">
        <div className="pointer-events-none absolute inset-0 select-none">
          <Image
            src="/assets/landing-wave.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[700px] px-4 sm:px-6">
          <SessionMockup />
        </div>
      </div>
    </section>
  );
}
