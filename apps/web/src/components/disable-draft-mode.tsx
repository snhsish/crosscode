"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

export function DisableDraftMode() {
  if (useIsPresentationTool()) return null;

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
    >
      Exit preview
    </a>
  );
}
