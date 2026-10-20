import { useConnections } from "@/store/connection.store"
import { useProjects } from "@/store/projects.store"

/**
 * Resolve the connection that owns a project.
 *
 * Multi-connection: every project records `connectionId`, so screens under
 * `/project/[projectId]/...` must use the owning connection, not a global
 * "current"/selected connection. Falls back to the legacy `current` id for
 * deep links / screens that don't know their project yet.
 *
 * Robustness: if the stored project points at a deleted connection, or the
 * project itself hasn't synced yet (empty store on a fresh install / deep
 * link), fall back to `current` and then to the sole available connection so
 * screens never render "Not connected" while a usable connection exists.
 * Sessions lists are persisted (stale cache can look "loaded"), but
 * messages/models/files need a live connection, so this fallback is what
 * un-breaks them.
 */
export function useProjectConnection(projectId?: string | null) {
    const connections = useConnections((s) => s.connections)
    const current = useConnections((s) => s.current)
    const project = useProjects((s) =>
        projectId ? (s.projects.find((p) => p.id === projectId) ?? null) : null
    )
    let connection =
        connections.find((c) => c.id === (project?.connectionId ?? current)) ?? null
    if (!connection && connections.length === 1) {
        connection = connections[0] ?? null
    }
    if (!connection && current) {
        connection = connections.find((c) => c.id === current) ?? null
    }
    // Last resort: any connection with credentials (e.g. project sync hasn't
    // run yet but the user has exactly one usable tunnel).
    if (!connection) {
        connection = connections.find((c) => c.url && c.token) ?? null
    }
    return { project, connection }
}
