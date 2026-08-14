import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { deviceSession, user } from "@/lib/db/schema"

export async function getAccountDevice(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 as const }
  }

  const token = authHeader.substring(7)
  const device = await db.query.deviceSession.findFirst({
    where: and(eq(deviceSession.token, token), eq(deviceSession.status, "claimed")),
  })

  if (!device) {
    return { error: "Invalid or unclaimed token", status: 401 as const }
  }

  if (new Date() > device.expiresAt) {
    return { error: "Token expired", status: 410 as const }
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, device.userId),
  })

  if (!userData) {
    return { error: "User not found", status: 404 as const }
  }

  return { device, user: userData }
}
