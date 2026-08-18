import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { getAccountDevice } from "@/lib/account-device-auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function getBillingUser(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (session) {
    return await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
  }

  const account = await getAccountDevice(req.headers.get("authorization"))
  if ("error" in account) return null
  return account.user
}
