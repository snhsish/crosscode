import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db, client } from "./db"
import * as schema from "./db/schema"
import { sendOTPEmail } from "./email"
import { logger } from "./logger"

logger.info("Auth", `Module loaded - DATABASE_URL=${process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@")}`)
logger.info("Auth", `BETTER_AUTH_URL=${process.env.BETTER_AUTH_URL || "(not set)"}, NEXT_PUBLIC_BETTER_AUTH_URL=${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "(not set)"}`)

async function checkDatabase() {
  try {
    await client`SELECT 1`
    logger.info("Auth", "Database connection OK")

    const tables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'verification'
    `

    if (tables.length === 0) {
      logger.info("Auth", "Creating verification table...")
      await client`
        CREATE TABLE IF NOT EXISTS verification (
          id TEXT PRIMARY KEY,
          identifier TEXT NOT NULL,
          value TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      logger.info("Auth", "Verification table created")
    } else {
      logger.info("Auth", "Verification table exists")
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Auth", `Database check failed: ${msg}`)
  }
}

checkDatabase()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }: { user: { email: string }; url: string; token: string }) => {
      logger.info("Auth", `Sending verification email to ${user.email}`)
      try {
        await sendOTPEmail(user.email, token, "Verify your email")
        logger.info("Auth", `Verification email sent to ${user.email}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.error("Auth", `Failed to send verification email to ${user.email}: ${msg}`)
        throw err
      }
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        logger.info("Auth", `Sending OTP - email=${email}, type=${type}`)
        try {
          const subject = type === "sign-in" ? "Your sign-in code" : "Your OTP code"
          await sendOTPEmail(email, otp, subject)
          logger.info("Auth", `OTP sent successfully to ${email}`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error("Auth", `Failed to send OTP to ${email}: ${msg}`)
          throw err
        }
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
})
