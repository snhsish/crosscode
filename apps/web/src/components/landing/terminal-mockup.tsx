"use client";

import { useEffect, useState } from "react";

const COMMAND = "npx crosscode";
const TYPE_SPEED_MS = 70;

function QrCode() {
  return (
    <svg width="132" height="132" viewBox="0 0 29 29" className="block">
      <rect width="29" height="29" fill="currentColor" className="text-background" />
      <g className="text-foreground" fill="currentColor">
        <rect x="0" y="0.5" width="7" height="1"/><rect x="9" y="0.5" width="7" height="1"/><rect x="18" y="0.5" width="3" height="1"/><rect x="22" y="0.5" width="7" height="1"/>
        <rect x="0" y="1.5" width="1" height="1"/><rect x="6" y="1.5" width="1" height="1"/><rect x="9" y="1.5" width="3" height="1"/><rect x="13" y="1.5" width="6" height="1"/><rect x="20" y="1.5" width="1" height="1"/><rect x="22" y="1.5" width="1" height="1"/><rect x="28" y="1.5" width="1" height="1"/>
        <rect x="0" y="2.5" width="1" height="1"/><rect x="2" y="2.5" width="3" height="1"/><rect x="6" y="2.5" width="1" height="1"/><rect x="8" y="2.5" width="3" height="1"/><rect x="12" y="2.5" width="2" height="1"/><rect x="15" y="2.5" width="1" height="1"/><rect x="19" y="2.5" width="1" height="1"/><rect x="22" y="2.5" width="1" height="1"/><rect x="24" y="2.5" width="3" height="1"/><rect x="28" y="2.5" width="1" height="1"/>
        <rect x="0" y="3.5" width="1" height="1"/><rect x="2" y="3.5" width="3" height="1"/><rect x="6" y="3.5" width="1" height="1"/><rect x="8" y="3.5" width="2" height="1"/><rect x="11" y="3.5" width="1" height="1"/><rect x="14" y="3.5" width="2" height="1"/><rect x="17" y="3.5" width="1" height="1"/><rect x="20" y="3.5" width="1" height="1"/><rect x="22" y="3.5" width="1" height="1"/><rect x="24" y="3.5" width="3" height="1"/><rect x="28" y="3.5" width="1" height="1"/>
        <rect x="0" y="4.5" width="1" height="1"/><rect x="2" y="4.5" width="3" height="1"/><rect x="6" y="4.5" width="1" height="1"/><rect x="8" y="4.5" width="1" height="1"/><rect x="11" y="4.5" width="1" height="1"/><rect x="15" y="4.5" width="6" height="1"/><rect x="22" y="4.5" width="1" height="1"/><rect x="24" y="4.5" width="3" height="1"/><rect x="28" y="4.5" width="1" height="1"/>
        <rect x="0" y="5.5" width="1" height="1"/><rect x="6" y="5.5" width="1" height="1"/><rect x="8" y="5.5" width="1" height="1"/><rect x="10" y="5.5" width="1" height="1"/><rect x="17" y="5.5" width="1" height="1"/><rect x="20" y="5.5" width="1" height="1"/><rect x="22" y="5.5" width="1" height="1"/><rect x="28" y="5.5" width="1" height="1"/>
        <rect x="0" y="6.5" width="7" height="1"/><rect x="8" y="6.5" width="1" height="1"/><rect x="10" y="6.5" width="1" height="1"/><rect x="12" y="6.5" width="1" height="1"/><rect x="14" y="6.5" width="1" height="1"/><rect x="16" y="6.5" width="1" height="1"/><rect x="18" y="6.5" width="1" height="1"/><rect x="20" y="6.5" width="1" height="1"/><rect x="22" y="6.5" width="7" height="1"/>
        <rect x="8" y="7.5" width="1" height="1"/><rect x="10" y="7.5" width="3" height="1"/><rect x="14" y="7.5" width="1" height="1"/><rect x="16" y="7.5" width="1" height="1"/><rect x="19" y="7.5" width="1" height="1"/>
        <rect x="0" y="8.5" width="1" height="1"/><rect x="2" y="8.5" width="5" height="1"/><rect x="9" y="8.5" width="1" height="1"/><rect x="12" y="8.5" width="1" height="1"/><rect x="16" y="8.5" width="2" height="1"/><rect x="20" y="8.5" width="1" height="1"/><rect x="22" y="8.5" width="5" height="1"/>
        <rect x="1" y="9.5" width="3" height="1"/><rect x="7" y="9.5" width="1" height="1"/><rect x="13" y="9.5" width="3" height="1"/><rect x="18" y="9.5" width="3" height="1"/><rect x="22" y="9.5" width="3" height="1"/><rect x="28" y="9.5" width="1" height="1"/>
        <rect x="1" y="10.5" width="1" height="1"/><rect x="6" y="10.5" width="3" height="1"/><rect x="10" y="10.5" width="2" height="1"/><rect x="13" y="10.5" width="4" height="1"/><rect x="20" y="10.5" width="2" height="1"/><rect x="24" y="10.5" width="1" height="1"/>
        <rect x="0" y="11.5" width="2" height="1"/><rect x="3" y="11.5" width="1" height="1"/><rect x="8" y="11.5" width="1" height="1"/><rect x="10" y="11.5" width="1" height="1"/><rect x="13" y="11.5" width="1" height="1"/><rect x="15" y="11.5" width="1" height="1"/><rect x="18" y="11.5" width="4" height="1"/><rect x="24" y="11.5" width="2" height="1"/><rect x="27" y="11.5" width="1" height="1"/>
        <rect x="0" y="12.5" width="1" height="1"/><rect x="2" y="12.5" width="2" height="1"/><rect x="6" y="12.5" width="4" height="1"/><rect x="11" y="12.5" width="1" height="1"/><rect x="14" y="12.5" width="2" height="1"/><rect x="17" y="12.5" width="1" height="1"/><rect x="19" y="12.5" width="1" height="1"/><rect x="21" y="12.5" width="1" height="1"/><rect x="23" y="12.5" width="1" height="1"/><rect x="25" y="12.5" width="2" height="1"/>
        <rect x="0" y="13.5" width="1" height="1"/><rect x="2" y="13.5" width="1" height="1"/><rect x="4" y="13.5" width="1" height="1"/><rect x="8" y="13.5" width="3" height="1"/><rect x="12" y="13.5" width="1" height="1"/><rect x="15" y="13.5" width="2" height="1"/><rect x="18" y="13.5" width="7" height="1"/><rect x="28" y="13.5" width="1" height="1"/>
        <rect x="4" y="14.5" width="1" height="1"/><rect x="6" y="14.5" width="2" height="1"/><rect x="9" y="14.5" width="1" height="1"/><rect x="11" y="14.5" width="1" height="1"/><rect x="22" y="14.5" width="5" height="1"/>
        <rect x="0" y="15.5" width="2" height="1"/><rect x="5" y="15.5" width="1" height="1"/><rect x="7" y="15.5" width="1" height="1"/><rect x="10" y="15.5" width="3" height="1"/><rect x="14" y="15.5" width="1" height="1"/><rect x="16" y="15.5" width="1" height="1"/><rect x="19" y="15.5" width="1" height="1"/><rect x="21" y="15.5" width="2" height="1"/><rect x="24" y="15.5" width="1" height="1"/><rect x="27" y="15.5" width="1" height="1"/>
        <rect x="0" y="16.5" width="1" height="1"/><rect x="2" y="16.5" width="3" height="1"/><rect x="6" y="16.5" width="1" height="1"/><rect x="9" y="16.5" width="3" height="1"/><rect x="16" y="16.5" width="3" height="1"/><rect x="20" y="16.5" width="1" height="1"/><rect x="25" y="16.5" width="2" height="1"/>
        <rect x="0" y="17.5" width="1" height="1"/><rect x="2" y="17.5" width="1" height="1"/><rect x="9" y="17.5" width="3" height="1"/><rect x="13" y="17.5" width="3" height="1"/><rect x="17" y="17.5" width="4" height="1"/><rect x="22" y="17.5" width="3" height="1"/><rect x="26" y="17.5" width="1" height="1"/><rect x="28" y="17.5" width="1" height="1"/>
        <rect x="0" y="18.5" width="1" height="1"/><rect x="2" y="18.5" width="1" height="1"/><rect x="6" y="18.5" width="1" height="1"/><rect x="9" y="18.5" width="2" height="1"/><rect x="12" y="18.5" width="6" height="1"/><rect x="20" y="18.5" width="1" height="1"/><rect x="23" y="18.5" width="2" height="1"/><rect x="26" y="18.5" width="1" height="1"/>
        <rect x="0" y="19.5" width="1" height="1"/><rect x="2" y="19.5" width="3" height="1"/><rect x="7" y="19.5" width="4" height="1"/><rect x="12" y="19.5" width="2" height="1"/><rect x="15" y="19.5" width="1" height="1"/><rect x="18" y="19.5" width="2" height="1"/><rect x="21" y="19.5" width="1" height="1"/><rect x="27" y="19.5" width="1" height="1"/>
        <rect x="0" y="20.5" width="1" height="1"/><rect x="5" y="20.5" width="2" height="1"/><rect x="8" y="20.5" width="1" height="1"/><rect x="10" y="20.5" width="1" height="1"/><rect x="12" y="20.5" width="1" height="1"/><rect x="14" y="20.5" width="2" height="1"/><rect x="17" y="20.5" width="1" height="1"/><rect x="20" y="20.5" width="5" height="1"/><rect x="26" y="20.5" width="3" height="1"/>
        <rect x="8" y="21.5" width="2" height="1"/><rect x="11" y="21.5" width="1" height="1"/><rect x="15" y="21.5" width="2" height="1"/><rect x="18" y="21.5" width="1" height="1"/><rect x="20" y="21.5" width="1" height="1"/><rect x="24" y="21.5" width="5" height="1"/>
        <rect x="0" y="22.5" width="7" height="1"/><rect x="9" y="22.5" width="2" height="1"/><rect x="19" y="22.5" width="2" height="1"/><rect x="22" y="22.5" width="1" height="1"/><rect x="24" y="22.5" width="3" height="1"/>
        <rect x="0" y="23.5" width="1" height="1"/><rect x="6" y="23.5" width="1" height="1"/><rect x="8" y="23.5" width="3" height="1"/><rect x="12" y="23.5" width="1" height="1"/><rect x="14" y="23.5" width="1" height="1"/><rect x="16" y="23.5" width="1" height="1"/><rect x="18" y="23.5" width="3" height="1"/><rect x="24" y="23.5" width="1" height="1"/><rect x="27" y="23.5" width="2" height="1"/>
        <rect x="0" y="24.5" width="1" height="1"/><rect x="2" y="24.5" width="3" height="1"/><rect x="6" y="24.5" width="1" height="1"/><rect x="8" y="24.5" width="1" height="1"/><rect x="10" y="24.5" width="1" height="1"/><rect x="12" y="24.5" width="1" height="1"/><rect x="17" y="24.5" width="1" height="1"/><rect x="20" y="24.5" width="5" height="1"/><rect x="26" y="24.5" width="1" height="1"/><rect x="28" y="24.5" width="1" height="1"/>
        <rect x="0" y="25.5" width="1" height="1"/><rect x="2" y="25.5" width="3" height="1"/><rect x="6" y="25.5" width="1" height="1"/><rect x="8" y="25.5" width="1" height="1"/><rect x="10" y="25.5" width="1" height="1"/><rect x="12" y="25.5" width="1" height="1"/><rect x="14" y="25.5" width="2" height="1"/><rect x="18" y="25.5" width="2" height="1"/><rect x="23" y="25.5" width="1" height="1"/><rect x="25" y="25.5" width="2" height="1"/>
        <rect x="0" y="26.5" width="1" height="1"/><rect x="2" y="26.5" width="3" height="1"/><rect x="6" y="26.5" width="1" height="1"/><rect x="8" y="26.5" width="4" height="1"/><rect x="13" y="26.5" width="3" height="1"/><rect x="20" y="26.5" width="1" height="1"/><rect x="22" y="26.5" width="6" height="1"/>
        <rect x="0" y="27.5" width="1" height="1"/><rect x="6" y="27.5" width="1" height="1"/><rect x="10" y="27.5" width="2" height="1"/><rect x="14" y="27.5" width="1" height="1"/><rect x="16" y="27.5" width="1" height="1"/><rect x="19" y="27.5" width="3" height="1"/><rect x="23" y="27.5" width="3" height="1"/><rect x="27" y="27.5" width="1" height="1"/>
        <rect x="0" y="28.5" width="7" height="1"/><rect x="8" y="28.5" width="1" height="1"/><rect x="10" y="28.5" width="2" height="1"/><rect x="14" y="28.5" width="4" height="1"/><rect x="19" y="28.5" width="1" height="1"/><rect x="21" y="28.5" width="3" height="1"/><rect x="26" y="28.5" width="1" height="1"/>
      </g>
    </svg>
  );
}

export function TerminalMockup() {
  const [charCount, setCharCount] = useState(0);
  const done = charCount >= COMMAND.length;

  useEffect(() => {
    if (done) return;
    const timeout = setTimeout(() => setCharCount((c) => c + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timeout);
  }, [charCount, done]);

  return (
    <div className="w-full max-w-lg flex flex-col">
      <div className="rounded-xl border bg-card h-[300px] md:h-[380px] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <div className="flex gap-1.5 mr-3">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">~/your/project</span>
        </div>
        <div className="p-6 font-mono text-sm space-y-2 flex-1 flex flex-col text-left">
          <div>
            <span className="text-emerald-500">$</span>
            <span className="text-foreground">&nbsp;&nbsp;{COMMAND.slice(0, charCount)}</span>
            {!done && <span className="inline-block w-2 h-4 align-text-bottom bg-muted-foreground animate-caret-blink" />}
          </div>
          {done && (
            <>
              <div className="text-muted-foreground">
                <span className="text-emerald-500">✓</span> OpenCode server started
              </div>
              <div className="text-muted-foreground">
                <span className="text-emerald-500">✓</span> Cloudflare Tunnel connected
              </div>
              <div>
                <span className="text-emerald-500">▲</span> <span className="text-muted-foreground">Ready →</span>{" "}
                <span className="text-emerald-500 underline">https://myapp.trycrosscode.dev</span>
              </div>
              <div className="pt-4 animate-fade-in">
                <QrCode />
              </div>
              <div className="mt-auto pt-4">
                <span className="text-emerald-500">$</span>
                <span className="inline-block w-2 h-4 bg-muted-foreground/50 animate-caret-blink ml-2" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
