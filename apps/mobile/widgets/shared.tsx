"use no memo";
import { FlexWidget, TextWidget } from "react-native-android-widget"
import type { ColorProp } from "react-native-android-widget"
import type { WidgetData } from "../lib/widget-data"

export const COLORS = {
  bg: "#0b0b0f",
  surface: "#16161d",
  border: "#26262f",
  text: "#fafafa",
  muted: "#a1a1aa",
  connected: "#4ade80",
  disconnected: "#f87171",
  pending: "#fbbf24",
  bar: "#7dd3fc",
} as const

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${Math.round(n)}`
}

export function formatCost(n: number): string {
  if (n <= 0) return "$0.00"
  if (n < 1) return `$${n.toFixed(3)}`
  return `$${n.toFixed(2)}`
}

export function formatRelativeTime(ts: number | null): string {
  if (!ts) return ""
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function BarChart({
  values,
  height,
  color = COLORS.bar,
}: {
  values: number[]
  height: number
  color?: ColorProp
}) {
  const max = Math.max(1, ...values)
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        height,
        alignItems: "flex-end",
        flexGap: 4,
      }}
    >
      {values.map((v, i) => {
        const barHeight = Math.max(2, Math.round((v / max) * (height - 2)))
        return (
          <FlexWidget
            key={i}
            style={{
              flex: 1,
              height,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <FlexWidget
              style={{
                height: barHeight,
                width: 8,
                backgroundColor: color,
                borderRadius: 3,
              }}
            />
          </FlexWidget>
        )
      })}
    </FlexWidget>
  )
}

export function StatusRow({ data }: { data: WidgetData }) {
  const label = data.connected
    ? data.serverName || "Connected"
    : "Not connected"
  return (
    <FlexWidget
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexGap: 6,
      }}
    >
      <TextWidget
        text={data.connected ? "●" : "○"}
        style={{ color: data.connected ? COLORS.connected : COLORS.disconnected, fontSize: 12 }}
      />
      <TextWidget text={label} style={{ color: COLORS.text, fontSize: 13, fontWeight: "bold" }} maxLines={1} truncate="END" />
      {data.pendingQuestions > 0 ? (
        <TextWidget
          text={`${data.pendingQuestions} pending`}
          style={{ color: COLORS.pending, fontSize: 12 }}
        />
      ) : null}
    </FlexWidget>
  )
}
