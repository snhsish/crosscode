import { View, ScrollView, Switch, AppState, Linking, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import ArrowLeft from "lucide-react-native/dist/esm/icons/arrow-left"
import Bell from "lucide-react-native/dist/esm/icons/bell"
import CreditCard from "lucide-react-native/dist/esm/icons/credit-card"
import ExternalLink from "lucide-react-native/dist/esm/icons/external-link"
import Info from "lucide-react-native/dist/esm/icons/info"
import LogOut from "lucide-react-native/dist/esm/icons/log-out"
import Mail from "lucide-react-native/dist/esm/icons/mail"
import Moon from "lucide-react-native/dist/esm/icons/moon"
import RotateCcw from "lucide-react-native/dist/esm/icons/rotate-ccw"
import Sun from "lucide-react-native/dist/esm/icons/sun"
import Terminal from "lucide-react-native/dist/esm/icons/terminal"
import UserIcon from "lucide-react-native/dist/esm/icons/user"
import Zap from "lucide-react-native/dist/esm/icons/zap"
import { useRouter } from "expo-router"
import { THEME } from "@/lib/theme"
import { useColorScheme } from "nativewind"
import Constants from "expo-constants"
import { useSettings } from "@/store/settings.store"
import { useConnections } from "@/store/connection.store"
import { useAuth } from "@/store/auth.store"
import { getAccountNotificationSettings, registerPushDevice, updateAccountNotificationSettings } from "@/lib/account-notifications"
import { createBillingPortal } from "@/lib/billing"
import { requestNotificationsPermission } from "@/lib/notifications"
import { TunnelUsageCard } from "@/components/TunnelUsageCard"
import { OpencodeStatsCard } from "@/components/OpencodeStatsCard"
import {
  SettingsDivider,
  SettingsIcon,
  SettingsLinkRow,
  SettingsRow,
  SettingsSection,
  SettingsSectionLabel,
} from "@/components/settings"
import React from "react"

const SUPPORT_EMAIL = "support@crosscode.site"

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const visible = Math.ceil(local.length / 2)
  return `${local.slice(0, visible)}${"*".repeat(local.length - visible)}@${domain}`
}
const WEB_APP_URL = "https://crosscode.site"
const PRIVACY_URL = "https://crosscode.site/legal/privacy"
const TERMS_URL = "https://crosscode.site/legal/terms"
const SUPPORT_URL = "https://crosscode.site/support"

export default function UserPage() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colorScheme, toggleColorScheme } = useColorScheme()
  const theme = colorScheme ?? "dark"

  const user = useAuth((s) => s.user)
  const sessionToken = useAuth((s) => s.sessionToken)
  const serverUrl = useAuth((s) => s.serverUrl)
  const logout = useAuth((s) => s.logout)
  const isLoggedIn = useAuth((s) => s.isLoggedIn)

  const clearLastRemoteUrlOnClose = useSettings((s) => s.clearLastRemoteUrlOnClose)
  const setClearLastRemoteUrlOnClose = useSettings((s) => s.setClearLastRemoteUrlOnClose)
  const notifications = useSettings((s) => s.notifications)
  const setNotifications = useSettings((s) => s.setNotifications)
  const emailForUpdates = useSettings((s) => s.emailForUpdates)
  const setEmailForUpdates = useSettings((s) => s.setEmailForUpdates)
  const allowTerminal = useSettings((s) => s.allowTerminal)
  const setAllowTerminal = useSettings((s) => s.setAllowTerminal)
  const resetOnboarding = useSettings((s) => s.resetOnboarding)

  const setCurrent = useConnections((s) => s.setCurrent)

  React.useEffect(() => {
    if (!clearLastRemoteUrlOnClose) return

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        setCurrent("" as never)
      }
    })

    return () => subscription.remove()
  }, [clearLastRemoteUrlOnClose, setCurrent])

  React.useEffect(() => {
    if (!serverUrl || !sessionToken) return

    getAccountNotificationSettings(serverUrl, sessionToken).then((settings) => {
      if (!settings) return
      const enabled =
        settings.agentResponseCompleted ||
        settings.agentQuestionInterruption ||
        settings.agentPermissionInterruption ||
        settings.agentErrorInterruption
      setNotifications(enabled)
    })
  }, [serverUrl, sessionToken, setNotifications])

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout()
            router.replace("/new-connection")
          },
        },
      ]
    )
  }

  const openLink = (url: string) => Linking.openURL(url)

  const openPricing = () => openLink(`${serverUrl ?? WEB_APP_URL}/pricing`)

  const handleNotificationsChange = React.useCallback(async (value: boolean) => {
    setNotifications(value)
    if (serverUrl && sessionToken) {
      await updateAccountNotificationSettings(serverUrl, sessionToken, value)
    }
    if (!value) return

    const granted = await requestNotificationsPermission()
    if (granted && serverUrl && sessionToken) {
      await registerPushDevice(serverUrl, sessionToken)
    }
  }, [serverUrl, sessionToken, setNotifications])

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset onboarding",
      "The onboarding guide will open again so you can walk through it from the beginning.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: () => {
            resetOnboarding()
            router.replace("/onboarding")
          },
        },
      ]
    )
  }

  const openBilling = async () => {
    if (!serverUrl || !sessionToken) return
    const url = await createBillingPortal(serverUrl, sessionToken)
    if (url) await Linking.openURL(url)
  }

  const version = Constants.expoConfig?.version ?? "1.0.0"
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? undefined
  const versionDisplay = buildNumber ? `${version} (${buildNumber})` : version

  const switchControl = (value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: THEME[theme].border, true: THEME[theme].primary }}
      thumbColor={THEME[theme].foreground}
    />
  )

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-4 flex-row items-center gap-2">
        <Button variant="ghost" className="w-10 h-10" onPress={() => router.back()}>
          <ArrowLeft size={25} color={THEME[theme].foreground} />
        </Button>
        <Text className="text-2xl font-semibold tracking-tight">Account</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ gap: 20, paddingHorizontal: 16, paddingBottom: 48 }}>
        {/* Account */}
        <SettingsSection title="Account">
          {isLoggedIn && user ? (
            <>
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary">
                  <UserIcon size={22} color={THEME[theme].background} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-medium" numberOfLines={1}>{maskEmail(user.email)}</Text>
                  <Text className="text-sm capitalize text-muted-foreground">{user.tier} tier</Text>
                </View>
              </View>

              {user.tier === "free" ? (
                <>
                  <SettingsDivider />
                  <SettingsLinkRow
                    icon={<Zap size={18} color={THEME[theme].primary} />}
                    title="Upgrade plan"
                    description="Compare Starter and Builder tiers"
                    onPress={openPricing}
                  />
                </>
              ) : (
                <>
                  <SettingsDivider />
                  <SettingsLinkRow
                    icon={<CreditCard size={18} color={THEME[theme].primary} />}
                    title="Manage billing"
                    description={`Manage your ${user.tier} plan and invoices`}
                    onPress={() => openBilling()}
                  />
                </>
              )}

              <SettingsDivider />
              <SettingsLinkRow
                icon={<LogOut size={18} color={THEME[theme].destructive} />}
                title="Log out"
                destructive
                onPress={handleLogout}
              />
            </>
          ) : (
            <View className="items-center gap-3 px-6 py-6">
              <SettingsIcon>
                <UserIcon size={18} color={THEME[theme].primary} />
              </SettingsIcon>
              <Text className="text-sm text-muted-foreground text-center">
                Scan a QR code from the terminal to login
              </Text>
              <Button onPress={() => router.push("/new-connection?mode=login")}>
                <Text>Scan QR to Login</Text>
              </Button>
            </View>
          )}
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <SettingsRow
            icon={
              colorScheme === "dark"
                ? <Moon size={18} color={THEME[theme].primary} />
                : <Sun size={18} color={THEME[theme].primary} />
            }
            title="Dark mode"
            description="Toggle between light and dark themes"
            control={switchControl(colorScheme === "dark", toggleColorScheme)}
          />
          <SettingsDivider />
          <SettingsRow
            icon={<Bell size={18} color={THEME[theme].primary} />}
            title="Push notifications"
            description="Alerts for connection status and agent activity"
            control={switchControl(notifications, handleNotificationsChange)}
          />
          <SettingsDivider />
          <SettingsRow
            icon={<Mail size={18} color={THEME[theme].primary} />}
            title="Product updates"
            description={isLoggedIn && user?.email ? `Email updates to ${maskEmail(user.email)}` : "Login to receive email updates"}
            control={switchControl(
              emailForUpdates === (user?.email ?? ""),
              (value) => setEmailForUpdates(value ? (user?.email ?? "") : "")
            )}
          />
        </SettingsSection>

        {/* Workspace */}
        <SettingsSection title="Workspace">
          <SettingsRow
            icon={<Terminal size={18} color={THEME[theme].primary} />}
            title="Allow terminal"
            description="Permit remote git and terminal-backed features on your connections"
            control={switchControl(allowTerminal, setAllowTerminal)}
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<Zap size={18} color={THEME[theme].primary} />}
            title="Quick prompts"
            description="Manage your saved quick prompts"
            onPress={() => router.push("/quick-prompts")}
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<RotateCcw size={18} color={THEME[theme].primary} />}
            title="Replay onboarding"
            description="Review the guide to CrossCode features"
            onPress={handleResetOnboarding}
          />
        </SettingsSection>

        {/* Usage */}
        <View className="gap-2">
          <SettingsSectionLabel>Usage</SettingsSectionLabel>
          <View className="gap-4">
            <TunnelUsageCard />
            <OpencodeStatsCard />
          </View>
        </View>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            icon={<Info size={18} color={THEME[theme].primary} />}
            title="Version"
            description={versionDisplay}
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<ExternalLink size={18} color={THEME[theme].primary} />}
            title="Privacy policy"
            onPress={() => openLink(PRIVACY_URL)}
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<ExternalLink size={18} color={THEME[theme].primary} />}
            title="Terms of use"
            onPress={() => openLink(TERMS_URL)}
          />
          <SettingsDivider />
          <SettingsLinkRow
            icon={<ExternalLink size={18} color={THEME[theme].primary} />}
            title="Support"
            onPress={() => openLink(SUPPORT_URL)}
          />
        </SettingsSection>

        <Text className="pt-2 pb-2 text-center text-xs text-muted-foreground">
          Need help? Contact us at{" "}
          <Text
            className="text-xs text-primary"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            {SUPPORT_EMAIL}
          </Text>
        </Text>
      </ScrollView>
    </View>
  )
}
