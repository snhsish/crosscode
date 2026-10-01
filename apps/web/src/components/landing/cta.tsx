"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Check, Copy, Terminal } from "lucide-react";
import { DownloadIcon } from "@/components/landing/hero-title";

function CopyCommand() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText("npx crosscode");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={copy}
      className="group flex w-full items-center gap-3 rounded-[14px] border border-white/12 bg-black/50 px-4 py-3.5 text-left transition-colors hover:border-white/25"
    >
      <Terminal className="h-4 w-4 shrink-0 text-white/50" />
      <span className="flex-1 font-mono text-[14px] text-white/90">
        <span className="mr-2 text-white/35">$</span>npx crosscode
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/10 text-white/70 transition-colors group-hover:bg-white group-hover:text-black">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </span>
    </button>
  );
}

export function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const borderRadius = useTransform(scrollYProgress, [0, 1], [0, 36]);
  const width = useTransform(scrollYProgress, [0, 1], ["100%", "92%"]);

  return (
    <section ref={sectionRef} className="bg-white pb-20 pt-4 sm:pb-28">
      <motion.div
        style={{ borderRadius, width }}
        className="relative mx-auto w-full max-w-[1120px] overflow-hidden bg-[#131313] px-6 py-16 sm:px-12 sm:py-20"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-white/[0.12] blur-[120px]" />
          <div className="absolute -bottom-48 -left-24 h-[320px] w-[320px] rounded-full bg-white/[0.07] blur-[100px]" />
          <div className="absolute -bottom-48 -right-24 h-[320px] w-[320px] rounded-full bg-white/[0.07] blur-[100px]" />
        </div>

        <div className="relative">
          <h2
            className="mx-auto max-w-[680px] text-center font-medium leading-[1.05] tracking-[-0.025em] text-white text-[34px] sm:text-[52px]"
            style={{ fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif" }}
          >
            Code from anywhere, in minutes.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-center text-[15px] leading-[1.65] text-white/60 sm:text-[16px]">
            Pair your computer with your phone once. Then approve, chat, and
            ship from wherever you are.
          </p>

          <div className="mx-auto mt-12 grid max-w-[860px] gap-0 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] sm:grid-cols-2">
            <div className="p-7 text-left sm:p-9">
              <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-white">
                Start the CLI
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
                Run this on the machine where your code lives.
              </p>
              <div className="mt-5">
                <CopyCommand />
              </div>
              <p className="mt-3 text-[12.5px] text-white/35">
                Requires Node.js 18+ · No account needed
              </p>
            </div>

            <div className="border-t border-white/10 p-7 text-left sm:border-l sm:border-t-0 sm:p-9">
              <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-white">
                Get the app
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">
                Scan the QR code from the CLI to pair instantly.
              </p>
              <div className="mt-5">
                <Link
                  href="/download"
                  className="flex w-full items-center justify-between gap-4 rounded-[14px] bg-white py-2 pl-6 pr-2 text-[16px] font-medium text-[#1d1d1d] transition-colors hover:bg-neutral-200"
                >
                  Download for Android
                  <DownloadIcon />
                </Link>
              </div>
              <p className="mt-3 text-[12.5px] text-white/35">
                Free to start · App Store release soon
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
