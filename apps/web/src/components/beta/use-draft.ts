"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useFormDraft(storageKey: string) {
  const ref = useRef<HTMLFormElement>(null)
  const [restored, setRestored] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- restoring a persisted draft after mount legitimately needs setState */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const form = ref.current
      if (raw && form) {
        const saved = JSON.parse(raw) as Record<string, string | string[] | boolean>
        for (const [name, value] of Object.entries(saved)) {
          const els = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)
          els.forEach((el) => {
            if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
              if (Array.isArray(value)) el.checked = value.includes(el.value)
              else if (typeof value === "boolean") el.checked = value
              else el.checked = el.value === value
            } else if (value !== undefined) {
              el.value = String(Array.isArray(value) ? value[0] ?? "" : value)
            }
          })
        }
        setHasDraft(true)
      }
    } catch {}
    setRestored(true)
  }, [storageKey])

  const save = useCallback(() => {
    const form = ref.current
    if (!form) return
    const data: Record<string, string | string[] | boolean> = {}
    const els = form.elements
    for (let i = 0; i < els.length; i++) {
      const el = els[i] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      if (!el.name) continue
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        const siblings = form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${el.name}"]`)
        if (siblings.length > 1) {
          data[el.name] = Array.from(siblings).filter((s) => s.checked).map((s) => s.value)
        } else {
          data[el.name] = el.checked
        }
      } else if (el instanceof HTMLInputElement && el.type === "radio") {
        const checked = form.querySelector<HTMLInputElement>(`input[type="radio"][name="${el.name}"]:checked`)
        if (checked) data[el.name] = checked.value
      } else {
        if (el.value) data[el.name] = el.value
      }
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
      setHasDraft(true)
    } catch {}
  }, [storageKey])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {}
    setHasDraft(false)
  }, [storageKey])

  return { ref, restored, hasDraft, save, clear }
}
