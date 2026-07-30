import * as React from "react"
import { Modal, Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DialogProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function Dialog({ open, onClose, children }: DialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center" onPress={onClose}>
        <View className="bg-black/40 absolute inset-0" />
        <Pressable className="bg-card rounded-2xl w-[85%] max-w-sm p-6 shadow-lg" onPress={(e) => e.stopPropagation()}>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

type DialogHeaderProps = {
  icon?: React.ReactNode
  title: string
  description?: string
}

function DialogHeader({ icon, title, description }: DialogHeaderProps) {
  return (
    <View className="items-center gap-3 mb-6">
      {icon && (
        <View className="w-12 h-12 rounded-full items-center justify-center">
          {icon}
        </View>
      )}
      <View className="items-center gap-1">
        <Text className="text-lg font-semibold text-center text-foreground">{title}</Text>
        {description && (
          <Text className="text-sm text-muted-foreground text-center">{description}</Text>
        )}
      </View>
    </View>
  )
}

type DialogFooterProps = {
  cancelLabel?: string
  confirmLabel: string
  variant?: "default" | "destructive"
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

function DialogFooter({
  cancelLabel = "Cancel",
  confirmLabel,
  variant = "default",
  onCancel,
  onConfirm,
  loading,
}: DialogFooterProps) {
  return (
    <View className="flex-row gap-3 mt-2">
      <Button
        variant="outline"
        className="flex-1 h-11"
        onPress={onCancel}
        disabled={loading}
      >
        <Text className="text-sm font-medium text-foreground">{cancelLabel}</Text>
      </Button>
      <Button
        variant={variant}
        className="flex-1 h-11"
        onPress={onConfirm}
        disabled={loading}
      >
        <Text className={cn("text-sm font-medium", variant === "destructive" ? "text-white" : "text-primary-foreground")}>
          {confirmLabel}
        </Text>
      </Button>
    </View>
  )
}

export { Dialog, DialogHeader, DialogFooter }
