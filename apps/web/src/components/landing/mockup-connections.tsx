import { ArrowLeft, Plus, Search, Wifi, WifiOff } from "lucide-react";
import { MockupStatusBar } from "@/components/landing/mockup-statusbar";

type DemoConnection = {
  name: string;
  url: string;
  project: string;
  status: "active" | "available" | "unreachable";
};

const DEMO_CONNECTIONS: DemoConnection[] = [
  {
    name: "MacBook Pro",
    url: "macbook-pro.local",
    project: "~/crosscode",
    status: "active",
  },
  {
    name: "Dev Server",
    url: "dev.acme.internal",
    project: "~/api",
    status: "available",
  },
  {
    name: "Homelab",
    url: "homelab.tailnet",
    project: "~/homelab",
    status: "available",
  },
  {
    name: "Workstation",
    url: "192.168.1.42",
    project: "~/work",
    status: "unreachable",
  },
];

const STATUS_STYLES: Record<DemoConnection["status"], string> = {
  active: "bg-green-500/15 text-green-600",
  available: "bg-[#1a1a1a]/5 text-[#1a1a1a]",
  unreachable: "bg-red-500/10 text-red-500",
};

const ICON_STYLES: Record<DemoConnection["status"], string> = {
  active: "bg-green-500/20",
  available: "bg-[#1a1a1a]/5",
  unreachable: "bg-red-500/10",
};

function ConnectionRow({ connection }: { connection: DemoConnection }) {
  const unreachable = connection.status === "unreachable";
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-[#e4e4e4]/70 bg-[#f4f4f5]/40 px-3 py-3"
      style={unreachable ? { opacity: 0.65 } : undefined}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_STYLES[connection.status]}`}
      >
        {unreachable ? (
          <WifiOff size={17} className="text-red-500" />
        ) : (
          <Wifi size={17} className="text-[#1a1a1a]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-left text-[13px] font-semibold text-[#1a1a1a]">
          {connection.name}
        </p>
        <p className="mt-0.5 truncate text-left text-[11px] text-[#8e8e8e]">
          {connection.url}
        </p>
        <p className="mt-0.5 truncate text-left font-mono text-[10px] text-[#8e8e8e]/80">
          {connection.project}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[connection.status]}`}
      >
        {connection.status}
      </span>
    </div>
  );
}

export function MockupConnectionsView() {
  return (
    <div className="flex h-full flex-col bg-white">
      <MockupStatusBar />

      {/* Header */}
      <div className="flex items-center gap-0.5 border-b border-[#c9c9c9] px-2 py-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#333333]/80">
          <ArrowLeft size={19} strokeWidth={2} />
        </span>
        <h3 className="ml-1 min-w-0 flex-1 truncate text-left text-[16px] font-semibold text-[#333333]/80">
          Connections
        </h3>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1d1d1d]">
          <Plus size={15} className="text-white" />
        </span>
      </div>

      {/* Search */}
      <div className="px-3.5 pt-3">
        <div className="flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-3.5 py-2.5">
          <Search size={14} className="shrink-0 text-[#8e8e8e]" />
          <span className="text-[13px] text-[#a3a3a3]">Search connections...</span>
        </div>
      </div>

      {/* Filter + sort chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pt-2.5">
        <span className="mr-0.5 text-[11px] text-[#8e8e8e]">Filter:</span>
        {["All", "Active", "Inactive"].map((label) => (
          <span
            key={label}
            className={`rounded-full border px-2 py-1 text-[10px] ${
              label === "All"
                ? "border-[#1a1a1a] bg-[#1a1a1a]/5 font-medium text-[#1a1a1a]"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 pt-1.5">
        <span className="mr-0.5 text-[11px] text-[#8e8e8e]">Sort:</span>
        {["Recent", "Name", "Status"].map((label) => (
          <span
            key={label}
            className={`rounded-full border px-2 py-1 text-[10px] ${
              label === "Recent"
                ? "border-[#1a1a1a] bg-[#1a1a1a]/5 font-medium text-[#1a1a1a]"
                : "border-[#e2e2e2] text-[#8e8e8e]"
            }`}
          >
            {label}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-[#8e8e8e]">4 connections</span>
      </div>

      {/* List */}
      <div className="mb-4 mt-2 flex flex-1 flex-col gap-2 overflow-hidden rounded-b-[40px] border-t border-[#e4e4e4]/70 px-3.5 pt-2.5">
        {DEMO_CONNECTIONS.map((c) => (
          <ConnectionRow key={c.name} connection={c} />
        ))}
      </div>
    </div>
  );
}
