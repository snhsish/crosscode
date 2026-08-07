import nodemailer from "nodemailer"
import { logger } from "./logger"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587")
const SMTP_SECURE = process.env.SMTP_SECURE === "true"
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASSWORD = process.env.SMTP_PASSWORD
const SMTP_FROM = process.env.SMTP_FROM || "noreply@crosscode.app"

logger.info("Email", `Module loaded - SMTP_HOST=${SMTP_HOST}, SMTP_PORT=${SMTP_PORT}, SMTP_SECURE=${SMTP_SECURE}, SMTP_USER=${SMTP_USER ? SMTP_USER.replace(/^(.)(.*)(.@.*)$/, "$1***$3") : "(not set)"}, SMTP_FROM=${SMTP_FROM}`)

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER && SMTP_PASSWORD
    ? { user: SMTP_USER, pass: SMTP_PASSWORD }
    : undefined,
})

let smtpVerified = false

async function verifySmtpConnection() {
  if (smtpVerified) return true
  try {
    await transporter.verify()
    smtpVerified = true
    logger.info("Email", "SMTP connection verified successfully")
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Email", `SMTP connection verification failed: ${msg}`)
    return false
  }
}

export async function sendOTPEmail(email: string, otp: string, subject: string) {
  logger.info("Email", `Sending OTP email to ${email} - subject="${subject}"`)

  const connected = await verifySmtpConnection()
  if (!connected) {
    logger.error("Email", `Aborting send to ${email} - SMTP not reachable`)
    throw new Error("SMTP connection failed - check SMTP_HOST, SMTP_PORT, and credentials")
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: `${subject} - CrossCode`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">CrossCode</h2>
          <p style="color: #4a4a4a; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; color: #1a1a1a; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #6a6a6a; font-size: 14px;">This code expires in 10 minutes.</p>
          <p style="color: #9a9a9a; font-size: 12px; margin-top: 32px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    })
    logger.info("Email", `Successfully sent to ${email} - messageId=${info.messageId}`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const code = (err as { code?: string })?.code || "UNKNOWN"
    logger.error("Email", `Failed to send to ${email} - code=${code}, message=${msg}`)
    throw err
  }
}
