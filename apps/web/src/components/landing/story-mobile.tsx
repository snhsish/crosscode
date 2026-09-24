"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { HeroTitle } from "@/components/landing/hero-title";
import { DownloadIcon } from "@/components/landing/hero-title";
import { SessionMockup, type MockupView } from "@/components/landing/session-mockup";
import { STORY_COPIES, StoryCopyBlock } from "@/components/landing/story-copy";

function StaticFallback() {
  return (
    <div className="bg-white">
      <section className="relative flex min-h-[calc(100svh-68px)] flex-col overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-[1100px] shrink-0 px-5 pt-16">
          <HeroTitle />
        </div>
        <div className="relative z-0 mt-8 flex flex-1 flex-col justify-end">
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
          <div className="relative z-10 mx-auto w-full max-w-[460px] px-4">
            <div className="h-[430px] overflow-hidden">
              <SessionMockup view="chat" streamT={1} />
            </div>
          </div>
        </div>
      </section>
      {STORY_COPIES.map((copy) => (
        <section key={copy.eyebrow} className="mx-auto w-full max-w-[460px] px-5 py-12">
          <StoryCopyBlock copy={copy} />
        </section>
      ))}
    </div>
  );
}

export function StoryMobile() {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const triggerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const copyWrapRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<MockupView>("chat");
  const [copyIdx, setCopyIdx] = useState(-1);
  const [streamT, setStreamT] = useState(0.6);
  const stateRef = useRef({ view: "chat" as MockupView, copyIdx: -1, streamQ: 0.6 });

  useLayoutEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(copyWrapRef.current, { autoAlpha: 0, height: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top+=68px",
          end: "+=280%",
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const rawStream = Math.min(1, 0.6 + (0.4 * p) / 0.3);
            const streamQ = Math.round(rawStream * 120) / 120;
            const nextCopy = p > 0.7 ? 1 : p > 0.42 ? 0 : -1;
            const nextView: MockupView = p > 0.7 ? "models" : "chat";
            const s = stateRef.current;
            if (s.copyIdx !== nextCopy || s.view !== nextView || s.streamQ !== streamQ) {
              stateRef.current = { copyIdx: nextCopy, view: nextView, streamQ };
              if (s.copyIdx !== nextCopy) setCopyIdx(nextCopy);
              if (s.view !== nextView) setView(nextView);
              if (s.streamQ !== streamQ) setStreamT(streamQ);
            }
          },
        },
      });

      tl.to(titleRef.current, { autoAlpha: 0, y: -60, duration: 0.5, ease: "power1.in" }, 0);
      tl.to(titleRef.current, { height: 0, duration: 0.45 }, 0.5);
      tl.to(waveRef.current, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, 0);
      tl.fromTo(phoneRef.current, { y: 30 }, { y: 0, duration: 1.6 }, 0.2);
      tl.to(copyWrapRef.current, { autoAlpha: 1, height: 320, duration: 0.6 }, 1.5);
      tl.fromTo(copyWrapRef.current, { y: 24 }, { y: 0, duration: 0.5 }, 1.5);
      tl.to({}, { duration: 0.9 });
    }, triggerRef);

    return () => ctx.revert();
  }, [reduced]);

  if (reduced) return <StaticFallback />;

  return (
    <div className="bg-white">
      <section ref={triggerRef} className="relative overflow-hidden bg-white">
        <div className="relative flex h-[100svh] min-h-[640px] flex-col overflow-hidden pt-[68px]">
          <div
            ref={titleRef}
            className="relative z-10 mx-auto w-full max-w-[460px] shrink-0 overflow-hidden px-5 pt-8"
          >
            <HeroTitle />
          </div>

          <div className="relative z-0 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <div ref={waveRef} className="pointer-events-none absolute inset-0 select-none">
              <Image
                src="/assets/landing-wave.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-top"
              />
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 items-start justify-center overflow-hidden px-4 pt-4">
              <div ref={phoneRef} className="h-full min-h-0 w-fit">
                <div className="h-full max-h-[430px] w-[300px] overflow-hidden rounded-[40px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]">
                  <SessionMockup
                    view={view}
                    streamT={streamT}
                    className="w-[300px] max-w-none rounded-[40px]"
                  />
                </div>
              </div>
            </div>

            <div ref={copyWrapRef} className="relative z-10 overflow-hidden bg-white px-5 pb-6 pt-4">
              <div className="mx-auto min-h-[280px] w-full max-w-[460px]">
                <AnimatePresence initial={false} mode="wait">
                  {copyIdx >= 0 && (
                    <motion.div
                      key={copyIdx}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <StoryCopyBlock copy={STORY_COPIES[copyIdx]} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#ececec] px-5 py-14 text-center">
        <p className="text-[15px] text-[#8e8e8e]">Ready when you are</p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/download"
            className="flex items-center gap-4 rounded-[10px] bg-[#1d1d1d] py-2 pl-6 pr-2 text-[17px] font-medium text-white transition-colors hover:bg-black"
          >
            Download for Android
            <DownloadIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}
