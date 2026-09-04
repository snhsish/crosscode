"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BETA_APP_VERSION, BETA_FLOWS, BUG_AREAS } from "@/lib/beta"
import { useFormDraft } from "./use-draft"

const BUGS_DRAFT_KEY = "beta-feedback-bugs-draft"
const MAX_BUGS = 10

type BugEntry = { area: string; desc: string }

function Rating({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <span className="text-sm font-medium">{label} *</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border text-sm has-checked:bg-primary has-checked:text-primary-foreground">
            <input type="radio" name={name} value={n} required={n === 3} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
    </div>
  )
}

export function FeedbackForm() {
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ref, save, clear, hasDraft } = useFormDraft("beta-feedback-draft")
  const [bugs, setBugs] = useState<BugEntry[]>([])
  const [bugsLoaded, setBugsLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUGS_DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          const clean = parsed
            .filter((b): b is BugEntry => typeof b === "object" && b !== null)
            .map((b) => ({ area: String(b.area ?? "").slice(0, 50), desc: String(b.desc ?? "").slice(0, 1000) }))
            .slice(0, MAX_BUGS)
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted bug drafts after mount needs setState
          if (clean.length > 0) setBugs(clean)
        }
      }
    } catch {}
    setBugsLoaded(true)
  }, [])

  useEffect(() => {
    if (!bugsLoaded) return
    try {
      localStorage.setItem(BUGS_DRAFT_KEY, JSON.stringify(bugs))
    } catch {}
  }, [bugs, bugsLoaded])

  useEffect(() => {
    const email = params.get("email")
    const form = ref.current
    if (email && form) {
      const input = form.querySelector<HTMLInputElement>('input[name="email"]')
      if (input && !input.value) {
        input.value = email
        save()
      }
    }
  }, [params, ref, save])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = new FormData(e.currentTarget)
    const bugsText = bugs
      .map((b) => b.area || b.desc ? `[${b.area || "Other"}] ${b.desc}`.trim() : "")
      .filter(Boolean)
      .join("\n\n")
    const res = await fetch("/api/beta/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        appVersion: BETA_APP_VERSION,
        deviceModel: data.get("deviceModel"),
        androidVersion: data.get("androidVersion"),
        flowsTested: data.getAll("flows"),
        ratingOverall: Number(data.get("ratingOverall")),
        ratingUx: Number(data.get("ratingUx")),
        ratingPerf: Number(data.get("ratingPerf")),
        bugs: bugsText,
        fav: data.get("fav"),
        missing: data.get("missing"),
        keepUsing: data.get("keepUsing"),
        testimonial: data.get("testimonial"),
        testimonialOptIn: true,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok) {
      setDone(true)
      clear()
      try {
        localStorage.removeItem(BUGS_DRAFT_KEY)
      } catch {}
    } else setError(json.error ?? "Something went wrong")
  }

  if (done) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6 text-center">
        <p className="text-lg font-semibold">Thank you! Review submitted.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          You unlocked 3 months of Builder Plan. We will email your reward shortly.
        </p>
      </div>
    )
  }

  return (
    <form ref={ref} onSubmit={onSubmit} onChange={save} className="space-y-5">
      {hasDraft && <p className="text-xs text-muted-foreground">Draft restored. Pick up where you left off.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="email" type="email" required placeholder="Email *" defaultValue={params.get("email") ?? ""} />
        <Input value={BETA_APP_VERSION} disabled aria-label="App version" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="deviceModel" required placeholder="Device e.g. Pixel 8 *" maxLength={100} />
        <Input name="androidVersion" required placeholder="Android e.g. 14 *" maxLength={50} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Flows tested *</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {BETA_FLOWS.map((f) => (
            <label key={f.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input type="checkbox" name="flows" value={f.id} className="h-4 w-4" />
              {f.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Rating name="ratingOverall" label="Overall" />
        <Rating name="ratingUx" label="Ease of use" />
        <Rating name="ratingPerf" label="Performance" />
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 sm:p-5">
          <p className="text-base font-semibold">Bugs and issues</p>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">Found something broken? Add each bug with its area and details. No bugs? Leave empty.</p>
          {bugs.length === 0 ? (
            <Button type="button" variant="default" className="w-full" onClick={() => setBugs([{ area: "", desc: "" }])}>
              Add bug
            </Button>
          ) : (
            <div className="space-y-4">
              {bugs.map((bug, i) => (
                <div key={i} className="space-y-3 rounded-lg border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-6 items-center rounded-full bg-primary px-3 text-xs font-semibold leading-none text-primary-foreground">Bug {i + 1}</span>
                    <button
                      type="button"
                      className="text-xs text-destructive underline-offset-4 hover:underline"
                      onClick={() => setBugs((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
                  </div>
                  <select
                    value={bug.area}
                    onChange={(e) => {
                      save()
                      setBugs((prev) => prev.map((b, idx) => (idx === i ? { ...b, area: e.target.value } : b)))
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Area (where is the bug?)</option>
                    {BUG_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <textarea
                    value={bug.desc}
                    onChange={(e) => {
                      save()
                      setBugs((prev) => prev.map((b, idx) => (idx === i ? { ...b, desc: e.target.value } : b)))
                    }}
                    rows={2}
                    placeholder="Describe the bug + steps + expected"
                    maxLength={1000}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
              {bugs.length < MAX_BUGS && (
                <Button type="button" variant="outline" className="w-full" onClick={() => setBugs((prev) => [...prev, { area: "", desc: "" }])}>
                  Add more
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <textarea name="fav" rows={3} placeholder="Favorite thing?" maxLength={2000} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <textarea name="missing" rows={3} placeholder="Missing / confusing?" maxLength={2000} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Use daily after launch?</span>
            <select name="keepUsing" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
          <Input name="testimonial" placeholder="One-line testimonial (may be shown publicly)" maxLength={2000} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Submit final review"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
