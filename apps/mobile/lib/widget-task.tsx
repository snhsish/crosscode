import { registerWidgetTaskHandler, requestWidgetUpdate } from "react-native-android-widget"
import { buildWidgetData } from "@/lib/widget-data"
import SmallWidget from "@/widgets/SmallWidget"
import MediumWidget from "@/widgets/MediumWidget"
import LargeWidget from "@/widgets/LargeWidget"

type WidgetData = Awaited<ReturnType<typeof buildWidgetData>>

const WIDGETS: Record<string, (data: WidgetData) => React.ReactElement> = {
  SmallWidget,
  MediumWidget,
  LargeWidget,
}

let registered = false

export function registerCrossCodeWidgets() {
  if (registered) return
  registered = true

  registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
    if (widgetAction === "WIDGET_DELETED") return

    const Component = WIDGETS[widgetInfo.widgetName]
    if (!Component) return

    const data = await buildWidgetData()
    renderWidget(<Component {...data} /> as never)
  })
}

export async function refreshWidgets() {
  const data = await buildWidgetData()
  await Promise.all(
    Object.keys(WIDGETS).map((name) => {
      const Component = WIDGETS[name]
      return requestWidgetUpdate({
        widgetName: name,
        renderWidget: () => <Component {...data} /> as never,
      }).catch(() => {})
    })
  )
}
