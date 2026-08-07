import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "@/lib/logger"

export default async function middleware(request: NextRequest) {
  const { method, nextUrl } = request
  const start = Date.now()

  const response = await NextResponse.next()

  const duration = Date.now() - start
  logger.info("HTTP", `${method} ${nextUrl.pathname}${nextUrl.search} -> ${response.status} (${duration}ms)`)

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
