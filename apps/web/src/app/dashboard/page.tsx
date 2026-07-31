"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

export default function DashboardPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; name: string; email: string; tier?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await authClient.getSession()
      if (!data?.session) {
        router.push("/login")
        return
      }
      setUser(data.user)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
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
            {apiKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm font-mono break-all">
                    {apiKey}
                  </code>
                  <Button onClick={copyApiKey} size="sm">
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
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
              </div>
            ) : (
              <div className="text-center py-6">
                <Button onClick={generateApiKey}>Generate API Key</Button>
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
              <span className="font-medium capitalize">{user?.tier || "free"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
