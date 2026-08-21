"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { LoaderCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export default function DashboardPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [subscription, setSubscription] = useState<{
    tier?: string | null
    status?: string
    renewsAt?: string | null
    cancelAtPeriodEnd?: boolean
  }>({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrStatus, setQrStatus] = useState<"idle" | "pending" | "claimed" | "expired">("idle")
  const [qrGenerating, setQrGenerating] = useState(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingError, setBillingError] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await authClient.getSession()
      if (!data?.session) {
        router.push("/login")
        return
      }
      setUser(data.user)
      const billingResponse = await fetch("/api/billing/subscription")
      if (billingResponse.ok) setSubscription(await billingResponse.json())
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const generateApiKey = async () => {
    try {
      const res = await fetch("/api/auth/api-key/generate", { method: "POST" })
      const data = await res.json()
      if (data.apiKey) {
        setApiKey(data.apiKey)
      }
    } catch (err) {
      console.error("Failed to generate API key:", err)
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const logout = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  const openCheckout = async (tier: "starter" | "builder") => {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, cycle: "monthly" }),
    })
    const data = await response.json()
    if (response.ok && data.checkoutUrl) window.location.assign(data.checkoutUrl)
  }

  const openPortal = async () => {
    setPortalLoading(true)
    setBillingError("")
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.assign(data.url)
      } else {
        setBillingError(data.error || "Unable to open billing portal")
      }
    } catch {
      setBillingError("Unable to open billing portal")
    } finally {
      setPortalLoading(false)
    }
  }

  const generateLoginQR = async () => {
    setQrGenerating(true)
    try {
      const res = await fetch("/api/auth/device-link/generate", { method: "POST" })
      const data = await res.json()
      if (data.qrData) {
        const qrUrl = await QRCode.toDataURL(data.qrData)
        setQrDataUrl(qrUrl)
        setQrToken(data.token)
        setQrStatus("pending")
        setDeviceName(null)
      }
    } catch (err) {
      console.error("Failed to generate QR:", err)
    } finally {
      setQrGenerating(false)
    }
  }

  useEffect(() => {
    if (qrToken && qrStatus === "pending") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/device-link/status?token=${qrToken}`)
          const data = await res.json()
          if (data.status === "claimed") {
            setQrStatus("claimed")
            setDeviceName(data.deviceName)
            if (pollRef.current) clearInterval(pollRef.current)
          } else if (data.status === "expired") {
            setQrStatus("expired")
            if (pollRef.current) clearInterval(pollRef.current)
          }
        } catch (err) {
          console.error("Polling error:", err)
        }
      }, 2000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [qrToken, qrStatus])

  const resetQR = () => {
    setQrDataUrl(null)
    setQrToken(null)
    setQrStatus("idle")
    setDeviceName(null)
    if (pollRef.current) clearInterval(pollRef.current)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>
              Use this API key to authenticate with the CrossCode CLI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type={apiKey ? "text" : "password"}
                value={apiKey || "THIS IS NOT AN ACTUAL API KEY LOL YOU GOT TROLLED"}
                readOnly
                className="font-mono"
              />
              {!apiKey && (
                <Button onClick={generateApiKey}>Generate API Key</Button>
              )}
              {apiKey && (
                <Button onClick={copyApiKey} size="sm">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
            {apiKey && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                  <li>Open your terminal on your PC</li>
                  <li>Run <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">npx crosscode</code></li>
                  <li>When prompted, paste the API key above</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tier:</span>
              <span className="font-medium capitalize">{subscription.tier || "free"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your CrossCode plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium capitalize">{subscription.tier || "free"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{subscription.status || (subscription.tier && subscription.tier !== "free" ? "active" : "free")}</span>
            </div>
            {subscription.renewsAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renews:</span>
                <span className="font-medium">{new Date(subscription.renewsAt).toLocaleDateString()}</span>
              </div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-600">Your subscription is scheduled to cancel at the end of this billing period.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {(!subscription.tier || subscription.tier === "free") ? (
                <>
                  <Button onClick={() => openCheckout("starter")}>Subscribe to Starter</Button>
                  <Button variant="outline" onClick={() => openCheckout("builder")}>Subscribe to Builder</Button>
                </>
              ) : (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                  {portalLoading && <LoaderCircle className="animate-spin" size={16} />}
                  {portalLoading ? "Opening portal..." : "Manage billing"}
                </Button>
              )}
            </div>
            {billingError && <p className="text-sm text-red-500">{billingError}</p>}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Login with Phone</CardTitle>
            <CardDescription>
              Scan the QR code with your phone to link it as a device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrStatus === "idle" && (
              <div className="text-center py-4">
                <Button onClick={generateLoginQR} disabled={qrGenerating}>
                  {qrGenerating && <LoaderCircle className="animate-spin" size={16} />}
                  {qrGenerating ? "Generating..." : "Generate Login QR"}
                </Button>
              </div>
            )}
            {qrStatus === "pending" && qrDataUrl && (
              <div className="flex flex-col items-center gap-4">
                <img src={qrDataUrl} alt="Login QR Code" className="w-64 h-64" />
                <p className="text-sm text-muted-foreground">Waiting for phone to scan...</p>
                <Button variant="outline" size="sm" onClick={resetQR}>
                  Cancel
                </Button>
              </div>
            )}
            {qrStatus === "claimed" && (
              <div className="text-center py-4 space-y-3">
                <div className="text-green-600 dark:text-green-400 text-lg font-medium">
                  Phone Linked Successfully!
                </div>
                {deviceName && (
                  <p className="text-sm text-muted-foreground">
                    Device: <span className="font-medium">{deviceName}</span>
                  </p>
                )}
                <Button variant="outline" onClick={resetQR}>
                  Generate New QR
                </Button>
              </div>
            )}
            {qrStatus === "expired" && (
              <div className="text-center py-4 space-y-3">
                <p className="text-orange-600 dark:text-orange-400">QR code expired</p>
                <Button onClick={generateLoginQR} disabled={qrGenerating}>
                  {qrGenerating && <LoaderCircle className="animate-spin" size={16} />}
                  {qrGenerating ? "Generating..." : "Generate New QR"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
