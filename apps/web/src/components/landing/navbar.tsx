"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-white/70 backdrop-blur-xl" : "bg-white/0 backdrop-blur-none"
      }`}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[880px] items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="CrossCode home">
          <Image
            src="/icon-light-mode.png"
            alt="CrossCode"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0"
          />
        </Link>
        <nav className="hidden items-center gap-7 sm:flex">
          <Link
            href="/docs"
            className="text-[16px] font-normal text-[#555555] transition-colors hover:text-black"
          >
            Docs
          </Link>
          <Link
            href="/download"
            className="text-[16px] font-normal text-[#555555] transition-colors hover:text-black"
          >
            Download
          </Link>
          <Link
            href="/pricing"
            className="text-[16px] font-normal text-[#555555] transition-colors hover:text-black"
          >
            Pricing
          </Link>
        </nav>
        <Link
          href="/login"
          className="rounded-full bg-[#1d1d1d] px-5 py-[7px] text-[15px] font-medium text-white transition-colors hover:bg-black"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
