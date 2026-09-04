import * as Updates from "expo-updates"

export type UpdateCheckOutcome =
  | "up-to-date"
  | "updated"
  | "unavailable-in-dev"
  | "disabled"

export function getUpdateInfo() {
  return {
    isEnabled: Updates.isEnabled,
    channel: Updates.channel ?? undefined,
    runtimeVersion: Updates.runtimeVersion ?? undefined,
    updateId: Updates.updateId ?? undefined,
    createdAt: Updates.createdAt ?? undefined,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  }
}

export async function checkAndApplyUpdate(): Promise<UpdateCheckOutcome> {
  if (__DEV__) return "unavailable-in-dev"
  if (!Updates.isEnabled) return "disabled"
  const check = await Updates.checkForUpdateAsync()
  if (!check.isAvailable) return "up-to-date"
  await Updates.fetchUpdateAsync()
  await Updates.reloadAsync()
  return "updated"
}
