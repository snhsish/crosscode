import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useConnections } from "@/store/connections";

export default function ConfirmConnectionScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addConnection = useConnections((s) => s.addConnection);
  const [name, setName] = useState("My PC");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch(`${url}/session`, { method: "GET" });
      if (res.ok) {
        setTested(true);
        Alert.alert("Connected", "Server is reachable.");
      } else {
        Alert.alert(
          "Error",
          `Server responded with status ${res.status}.`
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Could not reach the server. Check the URL."
      );
    } finally {
      setTesting(false);
    }
  }

  function save() {
    addConnection({ url, name });
    router.replace("/");
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Confirm Connection
        </ThemedText>

        <ThemedText style={styles.label}>Server URL</ThemedText>
        <ThemedView type="backgroundElement" style={styles.urlBox}>
          <ThemedText selectable>{url}</ThemedText>
        </ThemedView>

        <ThemedText style={styles.label}>Connection name</ThemedText>
        <TextInput
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
          value={name}
          onChangeText={setName}
          placeholder="My PC"
          placeholderTextColor={theme.textSecondary}
        />

        <Pressable
          style={[styles.button, tested && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={testing || tested}
        >
          <ThemedText style={styles.buttonText}>
            {testing
              ? "Testing..."
              : tested
                ? "✓ Connected"
                : "Test Connection"}
          </ThemedText>
        </Pressable>

        <Pressable style={[styles.button, styles.saveButton]} onPress={save}>
          <ThemedText style={styles.buttonText}>Save</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    marginBottom: Spacing.one,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: Spacing.two,
  },
  urlBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  input: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  button: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: "center",
    backgroundColor: "#208AEF",
    marginTop: Spacing.two,
  },
  saveButton: {
    backgroundColor: "#22c55e",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});