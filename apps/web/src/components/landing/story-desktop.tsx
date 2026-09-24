"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { DownloadIcon, HeroTitle } from "@/components/landing/hero-title";
import {
  MorphMockupFrame,
  type MockupDensity,
  type MockupView,
} from "@/components/landing/session-mockup";
import { STORY_COPIES, StoryCopyBlock } from "@/components/landing/story-copy";

const COPY_WIDTH = 500;
const COPY_GAP = 130;

export function StoryDesktop() {
  const triggerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const copyWrapRef = useRef<HTMLDivElement>(null);
  const copyInnerRef = useRef<HTMLDivElement>(null);

  const [density, setDensity] = useState<MockupDensity>("wide");
  const [view, setView] = useState<MockupView>("chat");
  const [copyIdx, setCopyIdx] = useState(-1);
  const [streamT, setStreamT] = useState(0);
  const stateRef = useRef({
    density: "wide" as MockupDensity,
    view: "chat" as MockupView,
    copyIdx: -1,
    streamQ: 0,
  });

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(shiftRef.current, { y: 0 });
      gsap.set(copyWrapRef.current, { marginLeft: -COPY_WIDTH, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top top+=68px",
          end: "+=320%",
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const rawMorph = Math.min(1, Math.max(0, (p - 0.08) / (0.47 - 0.08)));
            const morph = rawMorph * rawMorph * (3 - 2 * rawMorph);
            frameRef.current?.style.setProperty("--m", String(morph));
            const rawStream = Math.min(1, Math.max(0, (p - 0.18) / (0.68 - 0.18)));
            const streamQ = Math.round(rawStream * 120) / 120;
            const nextDensity: MockupDensity = p > 0.2 ? "phone" : "wide";
            const nextCopy = p > 0.75 ? 1 : p > 0.52 ? 0 : -1;
            const nextView: MockupView = p > 0.75 ? "models" : "chat";
            const s = stateRef.current;
            if (
              s.density !== nextDensity ||
              s.copyIdx !== nextCopy ||
              s.view !== nextView ||
              s.streamQ !== streamQ
            ) {
              stateRef.current = { density: nextDensity, copyIdx: nextCopy, view: nextView, streamQ };
              if (s.density !== nextDensity) setDensity(nextDensity);
              if (s.copyIdx !== nextCopy) setCopyIdx(nextCopy);
              if (s.view !== nextView) setView(nextView);
              if (s.streamQ !== streamQ) setStreamT(streamQ);
            }
          },
        },
      });

      tl.to(titleRef.current, { autoAlpha: 0, y: -140, duration: 0.55, ease: "power1.in" }, 0);
      tl.to(titleRef.current, { height: 0, paddingTop: 0, duration: 0.5 }, 0.9);
      tl.to(waveRef.current, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, 0);
      tl.to(
        frameRef.current,
        {
          width: 350,
          height: 747,
          borderRadius: "44px 44px 44px 44px",
          borderBottomWidth: 2,
          duration: 1.2,
        },
        0.35
      );
      tl.fromTo(
        shiftRef.current,
        {
          y: () => Math.max(0, (stageRef.current!.clientHeight - 410) / 2),
        },
        { y: 0, duration: 1.75, ease: "power2.inOut" },
        0.35
      );

      tl.to(copyWrapRef.current, { marginLeft: COPY_GAP, duration: 0.6 }, 1.5);
      tl.to(copyWrapRef.current, { autoAlpha: 1, duration: 0.35 }, 1.75);

      tl.to({}, { duration: 1.2 });
    }, triggerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section ref={triggerRef} className="relative overflow-hidden bg-white">
        <div className="relative flex h-[100svh] min-h-[815px] flex-col overflow-hidden pt-[68px]">
          <div
            ref={titleRef}
            className="relative z-10 mx-auto w-full max-w-[1280px] shrink-0 overflow-hidden px-6 pt-7"
          >
            <HeroTitle />
          </div>

          <div ref={stageRef} className="relative z-0 flex min-h-0 w-full flex-1">
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

            <div ref={rowRef} className="relative z-10 mx-auto flex h-full w-full max-w-[1280px] items-center justify-center px-6">
              <div className="flex items-center justify-center">
                <div ref={shiftRef} className="relative z-10">
                  <MorphMockupFrame density={density} view={view} streamT={streamT} frameRef={frameRef} />
                </div>
              </div>

              <div ref={copyWrapRef} className="pointer-events-none relative z-0 w-[500px] shrink-0 self-center">
                <div ref={copyInnerRef}>
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
        </div>
      </section>

      <section className="border-t border-[#ececec] bg-white px-6 py-16 text-center">
        <p className="text-[15px] text-[#8e8e8e]">Ready when you are</p>
        <div className="mt-5 flex justify-center">
          <Link
            href="/download"
            className="flex items-center gap-4 rounded-[10px] bg-[#1d1d1d] py-2 pl-6 pr-2 text-[19px] font-medium text-white transition-colors hover:bg-black"
          >
            Download for Android
            <DownloadIcon />
          </Link>
        </div>
      </section>
    </>
  );
}
