import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db, client } from "./db"
import * as schema from "./db/schema"
import { sendOTPEmail } from "./email"

console.log("[Auth] Module loaded, DATABASE_URL:", process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@"))

async function checkDatabase() {
  try {
    await client`SELECT 1`
    console.log("[Auth] Database connection OK")
    
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'verification'
    `
    
    if (tables.length === 0) {
      console.log("[Auth] Creating verification table...")
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
      console.log("[Auth] Verification table created")
    } else {
      console.log("[Auth] Verification table exists")
    }
  } catch (err: any) {
    console.error("[Auth] Database check failed:", err.message)
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
      await sendOTPEmail(user.email, token, "Verify your email")
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[Auth] Sending OTP: email=${email}, type=${type}`)
        await sendOTPEmail(email, otp, type === "sign-in" ? "Your sign-in code" : "Your OTP code")
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
})
