"use client";

import { AnimatePresence, motion } from "motion/react";
import { MockupChatView } from "@/components/landing/mockup-chat";
import { MockupModelsView } from "@/components/landing/mockup-models";
import { MockupWideView } from "@/components/landing/mockup-wide";
import { cn } from "@/lib/utils";

export type MockupView = "chat" | "models";
export type MockupDensity = "wide" | "phone";

const ease = [0.22, 1, 0.36, 1] as const;

export function SessionMockup({
  view,
  className,
}: {
  view: MockupView;
  className?: string;
}) {
  return (
    <div
      id="session-mockup"
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
            {view === "chat" ? <MockupChatView /> : <MockupModelsView />}
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
  density,
  view,
  frameRef,
}: {
  density: MockupDensity;
  view: MockupView;
  frameRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="mx-auto w-full max-w-[700px] px-6">
      <div
        ref={frameRef}
        className="relative mx-auto overflow-hidden border-[2px] border-[#c9c9c9] bg-white"
        style={WIDE_STYLE}
      >
        <AnimatePresence initial={false} mode="sync">
          {density === "wide" ? (
            <motion.div
              key="wide"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <MockupWideView />
            </motion.div>
          ) : (
            <motion.div
              key="phone"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={view}
                  className="absolute inset-0"
                  initial={{ opacity: 0, x: view === "models" ? 48 : -48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: view === "models" ? -32 : 32 }}
                  transition={{ duration: 0.45, ease }}
                >
                  {view === "chat" ? <MockupChatView /> : <MockupModelsView />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
