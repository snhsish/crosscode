"use no memo";
import { FlexWidget, TextWidget } from "react-native-android-widget"
import type { WidgetData } from "../lib/widget-data"
import { BarChart, COLORS, StatusRow, formatCost, formatNumber, formatRelativeTime } from "./shared"

export default function MediumWidget(props: WidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flexDirection: "column",
        padding: 14,
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        flexGap: 10,
      }}
    >
      <StatusRow data={props} />

      {props.hasSession ? (
        <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
          <TextWidget
            text={props.sessionTitle || "Untitled session"}
            style={{ color: COLORS.text, fontSize: 15, fontWeight: "bold" }}
            maxLines={1}
            truncate="END"
          />
          <TextWidget
            text={`${props.sessionAgent || "agent"} · ${formatRelativeTime(props.sessionUpdatedAt)}`}
            style={{ color: COLORS.muted, fontSize: 12 }}
            maxLines={1}
            truncate="END"
          />
        </FlexWidget>
      ) : (
        <TextWidget text="No active session" style={{ color: COLORS.muted, fontSize: 13 }} />
      )}

      <FlexWidget
        style={{
          flexDirection: "column",
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          padding: 10,
          flexGap: 8,
        }}
      >
        <FlexWidget style={{ flexDirection: "row", flexGap: 14 }}>
          <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
            <TextWidget text="Today tokens" style={{ color: COLORS.muted, fontSize: 11 }} />
            <TextWidget
              text={`${formatNumber(props.todayInputTokens)} in · ${formatNumber(props.todayOutputTokens)} out`}
              style={{ color: COLORS.text, fontSize: 13, fontWeight: "bold" }}
            />
          </FlexWidget>
          <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
            <TextWidget text="Today cost" style={{ color: COLORS.muted, fontSize: 11 }} />
            <TextWidget
              text={formatCost(props.todayCost)}
              style={{ color: COLORS.text, fontSize: 13, fontWeight: "bold" }}
            />
          </FlexWidget>
        </FlexWidget>

        <BarChart values={props.weekOutputTokens} height={34} />
        <TextWidget text="Output tokens · last 7 days" style={{ color: COLORS.muted, fontSize: 10 }} />
      </FlexWidget>
    </FlexWidget>
  )
}
