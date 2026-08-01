import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function proxy(request: NextRequest) {
  const { method, nextUrl } = request
  const start = Date.now()

  const response = NextResponse.next()

  const duration = Date.now() - start
  console.log(`${method} ${nextUrl.pathname}${nextUrl.search} → ${response.status} (${duration}ms)`)

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}
