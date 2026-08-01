"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

export function BrandLogo({ className = "h-8 w-8" }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <span className={className} />
  }

  const src = resolvedTheme === "dark" ? "/icon-dark-mode.png" : "/icon-light-mode.png"

  return (
    <Image
      src={src}
      alt="CrossCode"
      width={32}
      height={32}
      className={className}
    />
  )
}
