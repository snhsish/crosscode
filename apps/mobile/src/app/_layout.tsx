import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Spacing } from '@/constants/theme';

const tabs = [
  { name: 'index', icon: { focused: 'home', unfocused: 'home-outline' } as const },
  { name: 'sessions', icon: { focused: 'layers', unfocused: 'layers-outline' } as const },
  { name: 'scan', icon: { focused: 'qr-code', unfocused: 'qr-code-outline' } as const },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="sessions" />
        <Tabs.Screen name="scan" />
        <Tabs.Screen name="confirm-connection" options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'unspecified' ? 'light' : colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.backgroundElement,
          paddingBottom: insets.bottom + Spacing.three,
        },
      ]}>
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.name as any)}
            style={styles.tabItem}>
            <Ionicons
              name={isFocused ? tab.icon.focused : tab.icon.unfocused}
              size={26}
              color={isFocused ? colors.text : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
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

});
