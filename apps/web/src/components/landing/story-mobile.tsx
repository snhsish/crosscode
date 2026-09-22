"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { HeroTitle } from "@/components/landing/hero-title";
import { DownloadIcon } from "@/components/landing/hero-title";
import { SessionMockup } from "@/components/landing/session-mockup";
import { STORY_COPIES, StoryCopyBlock } from "@/components/landing/story-copy";

const reveal = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function StoryMobile() {
  return (
    <div className="bg-white">
      {/* Hero */}
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
              <SessionMockup view="chat" />
            </div>
          </div>
        </div>
      </section>

      {/* Chat feature */}
      <section className="mx-auto w-full max-w-[460px] px-5 pb-4 pt-16">
        <motion.div {...reveal}>
          <SessionMockup view="chat" />
        </motion.div>
        <motion.div {...reveal} className="mt-10">
          <StoryCopyBlock copy={STORY_COPIES[0]} />
        </motion.div>
      </section>

      {/* Models feature */}
      <section className="mx-auto w-full max-w-[460px] px-5 py-16">
        <motion.div {...reveal}>
          <SessionMockup view="models" />
        </motion.div>
        <motion.div {...reveal} className="mt-10">
          <StoryCopyBlock copy={STORY_COPIES[1]} />
        </motion.div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-[#ececec] px-5 py-14 text-center">
        <motion.div {...reveal}>
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
        </motion.div>
      </section>
    </div>
  );
}
