import { create } from "zustand"

export type PermissionTool = {
    messageID: string
    callID: string
}

export type PermissionRequest = {
    id: string
    sessionID: string
    permission: string
    patterns: string[]
    metadata: Record<string, unknown>
    always: string[]
    title?: string
    tool?: PermissionTool
}

type PermissionsStore = {
    permissionsBySession: Record<string, PermissionRequest[]>
    setPermissions: (sessionId: string, permissions: PermissionRequest[]) => void
    removePermission: (sessionId: string, requestId: string) => void
    clearSessionPermissions: (sessionId: string) => void
}

export const usePermissions = create<PermissionsStore>()((set) => ({
    permissionsBySession: {},

    setPermissions: (sessionId, permissions) =>
        set((state) => ({
            permissionsBySession: {
                ...state.permissionsBySession,
                [sessionId]: permissions,
            },
        })),

    removePermission: (sessionId, requestId) =>
        set((state) => ({
            permissionsBySession: {
                ...state.permissionsBySession,
                [sessionId]: (state.permissionsBySession[sessionId] ?? []).filter(
                    (p) => p.id !== requestId
                ),
            },
        })),

    clearSessionPermissions: (sessionId) =>
        set((state) => {
            const next = { ...state.permissionsBySession }
            delete next[sessionId]
            return { permissionsBySession: next }
        }),
}))
