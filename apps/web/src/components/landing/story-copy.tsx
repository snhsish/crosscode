import {
  ArrowLeftRight,
  FileDiff,
  FolderSearch,
  Layers,
  MessagesSquare,
  Paperclip,
  RefreshCw,
  Search,
  ShieldCheck,
  Wifi,
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
      "The full session in your pocket. Follow along live, steer the work and pick up right where you left off.",
    bullets: [
      { icon: MessagesSquare, text: "Real-time streaming replies" },
      { icon: ShieldCheck, text: "Approve or reject tool calls with permissions" },
      { icon: FileDiff, text: "Diffs, todos and files right in chat" },
      { icon: FolderSearch, text: "Browse files and the git graph" },
      { icon: Paperclip, text: "Attach images and files for context" },
    ],
  },
  {
    eyebrow: "Model picker",
    title: "Any model, one tap away.",
    description:
      "Your opencode setup, mirrored on mobile. Every provider and model from your own instance, ready when you are.",
    bullets: [
      { icon: RefreshCw, text: "Same models as your TUI and app" },
      { icon: Search, text: "Search across every provider" },
      { icon: Zap, text: "Switch mid-session without losing context" },
    ],
  },
  {
    eyebrow: "Connections",
    title: "Every project, connected at once.",
    description:
      "Keep every machine in one list. Add multiple opencode instances and jump between projects without reconnecting.",
    bullets: [
      { icon: Layers, text: "Connect to multiple instances at once" },
      { icon: ArrowLeftRight, text: "Hop between projects in one tap" },
      { icon: Wifi, text: "Live health for every connection" },
    ],
  },
];

export function StoryCopyBlock({ copy }: { copy: StoryCopy }) {
  return (
    <div className="max-w-[400px] text-left">
      <h2 className="text-[28px] font-medium leading-[1.08] tracking-[-0.025em] text-neutral-900 sm:text-[34px] lg:text-[36px]">
        {copy.title}
      </h2>
      <p className="mt-3 max-w-[380px] text-[15px] leading-[1.6] text-neutral-500 sm:text-[16px]">
        {copy.description}
      </p>
      <ul className="mt-7 space-y-4">
        {copy.bullets.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
              <Icon
                size={15}
                strokeWidth={1.8}
                className="text-neutral-700"
                aria-hidden="true"
              />
            </span>
            <span className="text-[14.5px] font-medium leading-[1.4] tracking-[-0.01em] text-neutral-900">
              {text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
