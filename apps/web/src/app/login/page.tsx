"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { GlyphMatrix } from "@/components/ui/glyph-matrix"
import { BrandLogo } from "@/components/brand-logo"
import { LoaderCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession()
      if (data?.session) {
        router.replace(new URLSearchParams(window.location.search).get("next") || "/dashboard")
        return
      }
      setCheckingSession(false)
    }
    checkSession()
  }, [router])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      })

      if (error) {
        setError(error.message || "Failed to send OTP")
      } else {
        setStep("otp")
      }
    } catch {
      setError("Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      })

      if (error) {
        setError(error.message || "Invalid OTP")
      } else {
        router.push(new URLSearchParams(window.location.search).get("next") || "/dashboard")
      }
    } catch {
      setError("Failed to verify OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          mask: "radial-gradient(circle, transparent 0%, transparent 20%, black 70%)",
          WebkitMask: "radial-gradient(circle, transparent 0%, transparent 20%, black 70%)",
        }}
      >
        <GlyphMatrix fadeBottom={0} />
      </div>
      <Card className="w-full max-w-md">
        {checkingSession ? (
          <CardContent className="flex justify-center py-12">
            <LoaderCircle className="animate-spin text-muted-foreground" size={32} />
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl flex justify-center"><BrandLogo className="h-10 w-10" /></CardTitle>
              <CardDescription>
                {step === "email"
                  ? "Sign in to your account"
                  : "Enter the OTP sent to your email"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={8}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setStep("email")}
                  >
                    Back
                  </Button>
                </form>
              )}
            </CardContent>
        </>
        )}
      </Card>
    </div>
  )
}
