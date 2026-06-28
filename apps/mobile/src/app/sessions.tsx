import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useConnections } from "@/store/connections";

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const connections = useConnections((s) => s.connections);
  const activeId = useConnections((s) => s.activeId);
  const removeConnection = useConnections((s) => s.removeConnection);
  const setActive = useConnections((s) => s.setActive);

  const paddingBottom =
    insets.bottom + BottomTabInset + Spacing.three;

  function handleDelete(id: string, name: string) {
    Alert.alert(
      "Remove connection",
      `Remove "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeConnection(id),
        },
      ]
    );
  }

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
        ]}>
        <ThemedText type="title">
          Sessions
        </ThemedText>
      </View>

      {connections.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText type="subtitle" themeColor="textSecondary">
            No connections yet
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyHint}>
            Scan a QR code from your terminal{"\n"}to connect to your PC
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={connections}
          contentContainerStyle={{
            paddingBottom,
            paddingHorizontal: Spacing.four,
            gap: Spacing.two,
          }}
          renderItem={({ item }) => {
            const isActive = item.id === activeId;
            return (
              <Pressable
                onPress={() => setActive(item.id)}
                onLongPress={() => handleDelete(item.id, item.name)}>
                <ThemedView
                  type={
                    isActive ? "backgroundSelected" : "backgroundElement"
                  }
                  style={styles.connectionCard}>
                  <View style={styles.cardContent}>
                    <ThemedText type="default" style={styles.connName}>
                      {item.name}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      numberOfLines={1}>
                      {item.url}
                    </ThemedText>
                  </View>
                  {isActive && (
                    <ThemedView style={styles.activeDot} />
                  )}
                </ThemedView>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: theme.text }]}
        onPress={() => router.push("/scan" as any)}>
        <ThemedText
          style={[styles.fabText, { color: theme.background }]}>
          +
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.three,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
  },
  emptyHint: {
    textAlign: "center",
    lineHeight: 20,
  },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  cardContent: {
    flex: 1,
    gap: Spacing.half,
  },
  connName: {
    fontWeight: "600",
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  fab: {
    position: "absolute",
    bottom: BottomTabInset + Spacing.five,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
});
