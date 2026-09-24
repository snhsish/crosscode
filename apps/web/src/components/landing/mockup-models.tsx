import { ArrowLeft, Check, Search } from "lucide-react";
import { MockupStatusBar } from "@/components/landing/mockup-statusbar";

type DemoModel = {
  name: string;
  provider: string;
  status: "active" | "beta" | "alpha";
  selected?: boolean;
};

const DEMO_MODELS: DemoModel[] = [
  { name: "Claude Sonnet 4", provider: "Anthropic", status: "active", selected: true },
  { name: "Claude Opus 4", provider: "Anthropic", status: "active" },
  { name: "GPT-5", provider: "OpenAI", status: "active" },
  { name: "GPT-5 Mini", provider: "OpenAI", status: "active" },
  { name: "Gemini 2.5 Pro", provider: "Google", status: "beta" },
  { name: "Gemini 2.5 Flash", provider: "Google", status: "beta" },
  { name: "Grok 4", provider: "xAI", status: "alpha" },
];

const STATUS_STYLES: Record<DemoModel["status"], string> = {
  active: "bg-green-500/15 text-green-600",
  beta: "bg-yellow-500/15 text-yellow-600",
  alpha: "bg-orange-500/15 text-orange-600",
};

function ModelRow({ model }: { model: DemoModel }) {
  return (
    <div
      className={`flex items-center border-b border-[#e4e4e4]/70 px-4 py-3 ${
        model.selected ? "bg-[#f4f4f5]/70" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-left text-[13px] font-medium text-[#1a1a1a]">
            {model.name}
          </p>
          {model.selected && <Check size={13} className="shrink-0 text-[#1a1a1a]" />}
        </div>
        <p className="mt-0.5 text-left text-[11px] text-[#8e8e8e]">{model.provider}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[model.status]}`}
      >
        {model.status}
      </span>
    </div>
  );
}

export function MockupModelsView() {
  return (
    <div className="flex h-full flex-col bg-white">
      <MockupStatusBar />

      {/* Header */}
      <div className="flex items-center gap-0.5 border-b border-[#c9c9c9] px-2 py-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <ArrowLeft size={19} strokeWidth={2} />
        </span>
        <h3 className="ml-1 min-w-0 flex-1 truncate text-left text-[16px] font-semibold text-[#333333]/80">
          Select Model
        </h3>
        <span className="max-w-[132px] shrink-0 truncate rounded-full border border-[#d7d7d7] bg-[#f4f4f5] px-2 py-1 text-[10px] text-[#8e8e8e]">
          Anthropic / claude-sonnet-4
        </span>
      </div>

      {/* Search */}
      <div className="px-3.5 pt-3">
        <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-3.5 py-2.5">
          <Search size={14} className="shrink-0 text-[#8e8e8e]" />
          <span className="text-[13px] text-[#a3a3a3]">Search models...</span>
        </div>
      </div>

      {/* Filter + sort chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pt-2.5">
        <span className="mr-0.5 text-[11px] text-[#8e8e8e]">Filter:</span>
        {["Active", "Beta", "Alpha", "All"].map((label) => (
          <span
            key={label}
            className={`rounded-full border px-2 py-1 text-[10px] ${
              label === "Active"
                ? "border-green-500/30 bg-green-500/15 font-medium text-green-600"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pt-1.5">
        <span className="mr-0.5 text-[11px] text-[#8e8e8e]">Sort:</span>
        {["Name", "Provider", "Status"].map((label) => (
          <span
            key={label}
            className={`rounded-full border px-2 py-1 text-[10px] ${
              label === "Name"
                ? "border-[#1a1a1a] bg-[#1a1a1a]/5 font-medium text-[#1a1a1a]"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-[#8e8e8e]">12 models</span>
      </div>

      {/* List */}
      <div className="mb-4 mt-2 flex-1 overflow-hidden rounded-b-[40px] border-t border-[#e4e4e4]/70">
        {DEMO_MODELS.map((m) => (
          <ModelRow key={m.name} model={m} />
        ))}
      </div>
    </div>
  );
}
