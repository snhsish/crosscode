import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BottomInset = Platform.select({ ios: 20, android: 8 }) ?? 0;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList />
      </TabList>
    </Tabs>
  );
}

function CustomTabList() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.tabBar,
        { backgroundColor: theme.background, borderTopColor: theme.backgroundElement },
      ]}>
      <TabTrigger name="index" href={'/' as any} asChild>
        <TabButton label="Home" icon="house" />
      </TabTrigger>
      <TabTrigger name="explore" href={'/explore' as any} asChild>
        <TabButton label="Explore" icon="magnifyingglass" />
      </TabTrigger>
      <TabTrigger name="scan" href={'/scan' as any} asChild>
        <TabButton label="Scan" icon="qrcode.viewfinder" />
      </TabTrigger>
    </View>
  );
}

function TabButton({
  label,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; icon: string }) {
  const theme = useTheme();

  return (
    <Pressable {...props} style={styles.tabItem}>
      <SymbolView
        tintColor={isFocused ? theme.text : theme.textSecondary}
        name={icon as any}
        size={24}
        weight="medium"
      />
      <ThemedText
        type="small"
        themeColor={isFocused ? 'text' : 'textSecondary'}
        style={styles.tabLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingBottom: BottomInset,
    paddingTop: Spacing.one,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
  },
});
