import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db } from "./db"
import * as schema from "./db/schema"
import { sendOTPEmail } from "./email"

console.log("[Auth] Module loaded, DATABASE_URL:", process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@"))

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
        console.log(`[Auth] sendVerificationOTP START: email=${email}, type=${type}, otp=${otp}`)
        try {
          console.log(`[Auth] About to call sendOTPEmail...`)
          await sendOTPEmail(email, otp, "Your OTP code")
          console.log(`[Auth] sendOTPEmail completed successfully`)
        } catch (error) {
          console.error(`[Auth] sendOTPEmail failed:`, error)
          throw error
        }
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
})
