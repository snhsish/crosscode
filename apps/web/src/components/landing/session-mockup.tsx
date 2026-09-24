"use client";

import { AnimatePresence, motion } from "motion/react";
import { MockupChatView } from "@/components/landing/mockup-chat";
import { MockupModelsView } from "@/components/landing/mockup-models";
import { cn } from "@/lib/utils";

export type MockupView = "chat" | "models";
export type MockupDensity = "wide" | "phone";

const ease = [0.22, 1, 0.36, 1] as const;

export function SessionMockup({
  view,
  className,
  streamT = 1,
}: {
  view: MockupView;
  className?: string;
  streamT?: number;
}) {
  return (
    <div
      id="session-mockup"
      style={{ ["--m" as string]: 1 }}
      className={cn(
        "relative mx-auto w-[350px] max-w-full overflow-hidden rounded-[44px] border-[2px] border-[#c9c9c9] bg-white",
        className
      )}
    >
      <div className="aspect-[9/19.2] w-full">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={view}
            className="absolute inset-0"
            initial={{ opacity: 0, x: view === "models" ? 48 : -48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: view === "models" ? -32 : 32 }}
            transition={{ duration: 0.45, ease }}
          >
            {view === "chat" ? <MockupChatView streamT={streamT} /> : <MockupModelsView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const WIDE_STYLE = {
  width: 620,
  height: 410,
  borderRadius: "64px 64px 0px 0px",
  borderBottomWidth: 0,
} as const;

export function MorphMockupFrame({
  view,
  streamT,
  frameRef,
}: {
  density: MockupDensity;
  view: MockupView;
  streamT: number;
  frameRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="mx-auto w-fit max-w-full">
      <div
        ref={frameRef}
        className="relative mx-auto overflow-hidden border-[2px] border-[#c9c9c9] bg-white shadow-[0_32px_80px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.06]"
        style={{ ...WIDE_STYLE, ["--m" as string]: 0 }}
      >
        <div className="absolute inset-0">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={view}
              className="absolute inset-0"
              initial={{ opacity: 0, x: view === "models" ? 48 : -48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: view === "models" ? -32 : 32 }}
              transition={{ duration: 0.45, ease }}
            >
              {view === "chat" ? <MockupChatView streamT={streamT} /> : <MockupModelsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
