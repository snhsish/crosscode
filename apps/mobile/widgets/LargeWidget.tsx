"use no memo";
import { FlexWidget, TextWidget } from "react-native-android-widget"
import type { WidgetData } from "../lib/widget-data"
import { BarChart, COLORS, StatusRow, formatCost, formatNumber } from "./shared"
import type { ProjectWidgetData } from "../lib/widget-data"

function ProjectRow({ project }: { project: ProjectWidgetData }) {
  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 10,
        flexGap: 6,
      }}
    >
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: 8 }}>
        <TextWidget
          text={project.name || "Unnamed project"}
          style={{ color: COLORS.text, fontSize: 13, fontWeight: "bold" }}
          maxLines={1}
          truncate="END"
        />
        <TextWidget text={formatCost(project.cost)} style={{ color: COLORS.muted, fontSize: 12 }} />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", alignItems: "center", flexGap: 8 }}>
        <TextWidget
          text={`${formatNumber(project.outputTokens)} out · ${project.responseCount} resp`}
          style={{ color: COLORS.muted, fontSize: 11 }}
        />
      </FlexWidget>
      <BarChart values={project.weekOutputTokens} height={20} />
    </FlexWidget>
  )
}

export default function LargeWidget(props: WidgetData) {
  const projects = props.projects.slice(0, 3)
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

      <FlexWidget style={{ flexDirection: "row", flexGap: 12 }}>
        <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
          <TextWidget text="Today cost" style={{ color: COLORS.muted, fontSize: 11 }} />
          <TextWidget text={formatCost(props.todayCost)} style={{ color: COLORS.text, fontSize: 14, fontWeight: "bold" }} />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: "column", flexGap: 2 }}>
          <TextWidget text="Today tokens" style={{ color: COLORS.muted, fontSize: 11 }} />
          <TextWidget
            text={`${formatNumber(props.todayInputTokens)} / ${formatNumber(props.todayOutputTokens)}`}
            style={{ color: COLORS.text, fontSize: 14, fontWeight: "bold" }}
          />
        </FlexWidget>
      </FlexWidget>

      {projects.length === 0 ? (
        <TextWidget text="No usage recorded yet" style={{ color: COLORS.muted, fontSize: 12 }} />
      ) : (
        <FlexWidget style={{ flexDirection: "column", flexGap: 8 }}>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  )
}
