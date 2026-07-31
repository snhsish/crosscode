import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendOTPEmail(email: string, otp: string, subject: string) {
  console.log(`[Email] Sending to ${email} with subject "${subject}"`)
  console.log(`[Email] SMTP config: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, user=${process.env.SMTP_USER}`)
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@crosscode.app",
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
    console.log(`[Email] Successfully sent to ${email}, messageId: ${info.messageId}`)
  } catch (error) {
    console.error(`[Email] Failed to send to ${email}:`, error)
    throw error
  }
}
