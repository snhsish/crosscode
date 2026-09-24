import {
  FileDiff,
  MessagesSquare,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type StoryCopy = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: { icon: LucideIcon; text: string }[];
};

export const STORY_COPIES: StoryCopy[] = [
  {
    eyebrow: "Session chat",
    title: "Your agent, live in chat.",
    description:
      "Stream responses, approve tool calls and review diffs — the full session, right from your pocket.",
    bullets: [
      { icon: MessagesSquare, text: "Real-time streaming replies" },
      { icon: ShieldCheck, text: "Approve or reject tool calls" },
      { icon: FileDiff, text: "Diffs, todos & files inline" },
    ],
  },
  {
    eyebrow: "Model picker",
    title: "Any model, one tap away.",
    description:
      "Search across providers, filter by release status and switch models mid-session.",
    bullets: [
      { icon: Search, text: "Search across providers" },
      { icon: SlidersHorizontal, text: "Filter Active / Beta / Alpha" },
      { icon: Zap, text: "Instant switch with variants" },
    ],
  },
];

export function StoryCopyBlock({ copy }: { copy: StoryCopy }) {
  return (
    <div className="max-w-[440px] text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1f86ff]">
        {copy.eyebrow}
      </p>
      <h2 className="mt-3 text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-neutral-900 sm:text-[34px] lg:text-[36px]">
        {copy.title}
      </h2>
      <p className="mt-3.5 text-[15px] leading-[1.6] text-neutral-500 sm:text-[16px]">
        {copy.description}
      </p>
      <ul className="mt-7 border-t border-neutral-200">
        {copy.bullets.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 border-b border-neutral-200 py-2.5 sm:py-3"
          >
            <Icon
              size={15}
              strokeWidth={1.75}
              className="shrink-0 text-neutral-400"
              aria-hidden="true"
            />
            <span className="text-[14px] font-medium tracking-[-0.01em] text-neutral-800 sm:text-[15px]">
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
