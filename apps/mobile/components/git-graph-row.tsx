import { memo } from "react"
import { Pressable, View } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"
import { Text } from "@/components/ui/text"
import { GraphRowData } from "@/lib/git-graph"

export const GIT_ROW_HEIGHT = 38
const LANE_WIDTH = 13
const DOT_RADIUS = 3.5

export const GIT_LANE_COLORS = [
    "#a78bfa",
    "#fb923c",
    "#22d3ee",
    "#4ade80",
    "#f472b6",
    "#60a5fa",
    "#facc15",
    "#f87171",
]

export type GitGraphRowProps = {
    subject: string
    shortHash: string
    refs: string
    graph: GraphRowData
    graphWidth: number
    textColor: string
    hashColor: string
    badgeBg: string
    badgeText: string
    onPress?: () => void
    onLongPress?: () => void
}

function laneCenter(lane: number): number {
    return lane * LANE_WIDTH + LANE_WIDTH / 2
}

function GitGraphRowInner({
    subject,
    shortHash,
    refs,
    graph,
    graphWidth,
    textColor,
    hashColor,
    badgeBg,
    badgeText,
    onPress,
    onLongPress,
}: GitGraphRowProps) {
    const height = GIT_ROW_HEIGHT
    const midY = height / 2
    const colorOf = (idx: number) => GIT_LANE_COLORS[idx % GIT_LANE_COLORS.length]
    const dotX = graph.dotLane >= 0 ? laneCenter(graph.dotLane) : -10
    const dotColor = colorOf(graph.dotColorIdx)

    const refNames = refs
        ? refs
              .split(", ")
              .map((r) => r.replace(/^HEAD -> /, ""))
              .filter(Boolean)
              .slice(0, 2)
        : []

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            className="flex-row items-center active:bg-accent/40"
            style={{ height }}
        >
            <Svg width={Math.max(graphWidth, LANE_WIDTH)} height={height}>
                {graph.pipes.map((pipe, i) => (
                    <Path
                        key={`p${i}`}
                        d={`M ${laneCenter(pipe.lane)} 0 L ${laneCenter(pipe.lane)} ${height}`}
                        stroke={colorOf(pipe.colorIdx)}
                        strokeWidth={1.5}
                        fill="none"
                    />
                ))}
                {graph.topHalves.map((th, i) => (
                    <Path
                        key={`t${i}`}
                        d={`M ${laneCenter(th.lane)} 0 L ${laneCenter(th.lane)} ${midY}`}
                        stroke={colorOf(th.colorIdx)}
                        strokeWidth={1.5}
                        fill="none"
                    />
                ))}
                {graph.curves.map((curve, i) => {
                    const fromX = dotX
                    const toX = laneCenter(curve.to)
                    return (
                        <Path
                            key={`c${i}`}
                            d={`M ${fromX} ${midY} C ${fromX} ${(midY + height) / 2}, ${toX} ${(midY + height) / 2}, ${toX} ${height}`}
                            stroke={colorOf(curve.colorIdx)}
                            strokeWidth={1.5}
                            fill="none"
                        />
                    )
                })}
                {graph.dotLane >= 0 && (
                    <Circle cx={dotX} cy={midY} r={DOT_RADIUS} fill={dotColor} />
                )}
            </Svg>

            {refNames.length > 0 && (
                <View className="flex-row gap-1" style={{ marginLeft: 6 }}>
                    {refNames.map((ref) => (
                        <View key={ref} className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: badgeBg }}>
                            <Text className="text-[10px]" style={{ color: badgeText }} numberOfLines={1}>
                                {ref}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <Text
                className="flex-1 text-xs"
                style={{ color: textColor, marginLeft: refNames.length > 0 ? 0 : 8 }}
                numberOfLines={1}
            >
                {subject}
            </Text>

            <Text className="text-[10px] font-mono" style={{ color: hashColor, marginLeft: 8, marginRight: 12 }}>
                {shortHash}
            </Text>
        </Pressable>
    )
}

export const GitGraphRow = memo(GitGraphRowInner)
