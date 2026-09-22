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
    <div className="text-left">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1f86ff]">
        {copy.eyebrow}
      </p>
      <h2
        className="mt-3 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-[#1a1a1a] sm:text-[40px]"
        style={{ fontFamily: "var(--font-manrope), Manrope, system-ui, sans-serif" }}
      >
        {copy.title}
      </h2>
      <p className="mt-4 text-[15px] leading-[1.6] text-[#555555] sm:text-[17px]">
        {copy.description}
      </p>
      <ul className="mt-6 flex flex-col gap-3.5">
        {copy.bullets.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1]">
              <Icon size={17} className="text-[#333333]" strokeWidth={2} />
            </span>
            <span className="text-[14px] font-medium text-[#333333] sm:text-[15px]">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
