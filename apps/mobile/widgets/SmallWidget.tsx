"use no memo";
import { FlexWidget, TextWidget } from "react-native-android-widget"
import type { WidgetData } from "../lib/widget-data"
import { COLORS, StatusRow, formatRelativeTime } from "./shared"

export default function SmallWidget(props: WidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        flexDirection: "column",
        padding: 12,
        backgroundColor: COLORS.bg,
        borderRadius: 16,
        flexGap: 8,
      }}
    >
      <StatusRow data={props} />
      {props.hasSession ? (
        <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
          <TextWidget
            text={props.sessionTitle || "Untitled session"}
            style={{ color: COLORS.text, fontSize: 14, fontWeight: "bold" }}
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
        <TextWidget text="No active session" style={{ color: COLORS.muted, fontSize: 12 }} />
      )}
    </FlexWidget>
  )
}
