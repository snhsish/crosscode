import { MockupChatView } from "@/components/landing/mockup-chat";

export function MockupWideView() {
  return (
    <div style={{ ["--m" as string]: 0 }} className="h-full">
      <MockupChatView streamT={0} />
    </div>
  );
}
