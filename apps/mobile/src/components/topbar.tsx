import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function Topbar({ title, actions }: { title: string, actions: React.ReactNode }) {
    const insets = useSafeAreaInsets()

    return (
        <ThemedView style={styles.container}>
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + Spacing.four,
                        paddingLeft: insets.left + Spacing.four,
                        paddingRight: insets.right + Spacing.four,
                    },
                ]}
            >
                <ThemedText type="title">{title}</ThemedText>
                {actions && <View style={styles.actions}>{actions}</View>}
            </View>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: Spacing.three,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
    },
})