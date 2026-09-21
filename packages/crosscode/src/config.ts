import { existsSync, readFileSync, writeFileSync } from "fs"
import crypto from "crypto"
import { configFile, logCrosscode } from "./log"
import { debug, censorToken } from "./util"

export type CloudflaredTunnel = {
    name: string
    credentialsPath: string
    url: string
}

export type ProjectConfig = {
    path?: string
    sessionToken?: string
    projectId?: string
    cloudflaredTunnel?: CloudflaredTunnel
    port?: number
}

export type Config = {
    ngrokToken?: string
    port?: number
    tunnelWsUrl?: string
    sessionToken?: string
    projectId?: string
    telemetry?: boolean
    cloudflaredTunnel?: CloudflaredTunnel
    projects?: Record<string, ProjectConfig>
    auth?: {
        email?: string
        sessionToken?: string
        tier?: string
    }
}

export function readConfig(): Config {
    if (!existsSync(configFile)) return {}
    try {
        return JSON.parse(readFileSync(configFile, "utf-8"))
    } catch {
        return {}
    }
}

export function saveConfig(config: Config) {
    writeFileSync(configFile, JSON.stringify(config, null, 2), { mode: 0o600 })
}

export function getProjectKey(): string {
    const cwd = process.cwd()
    const hash = crypto.createHash("sha256").update(cwd).digest("hex").slice(0, 16)
    return process.env.CROSSCODE_PROJECT_KEY || hash
}

export function getProjectConfig(config: Config): ProjectConfig {
    const key = getProjectKey()
    if (!config.projects) config.projects = {}
    if (!config.projects[key]) {
        const legacy: ProjectConfig = {}
        let migrated = false
        if (config.projectId && !Object.values(config.projects).some((p) => p.projectId === config.projectId)) {
            legacy.projectId = config.projectId
            migrated = true
        }
        if (config.sessionToken && !Object.values(config.projects).some((p) => p.sessionToken === config.sessionToken)) {
            legacy.sessionToken = config.sessionToken
            migrated = true
        }
        if (config.cloudflaredTunnel && !Object.values(config.projects).some((p) => p.cloudflaredTunnel?.name === config.cloudflaredTunnel?.name)) {
            legacy.cloudflaredTunnel = config.cloudflaredTunnel
            migrated = true
        }
        config.projects[key] = { path: process.cwd(), ...legacy }
        if (migrated) {
            saveConfig(config)
            logCrosscode(`Migrated legacy global identity to project ${process.cwd()} (key: ${key})`)
        }
    } else if (!config.projects[key].path) {
        config.projects[key].path = process.cwd()
    }
    return config.projects[key]
}

export function saveProjectConfig(config: Config) {
    const key = getProjectKey()
    if (config.projects?.[key]) config.projects[key].path = process.cwd()
    saveConfig(config)
}

// Stable, persistent per-project session identity so the QR/URL stays the
// same across CLI restarts and network blips, without leaking the same
// identity across different project directories.
export function ensureSessionToken(config: Config, project?: ProjectConfig): string {
    const target = project ?? getProjectConfig(config)
    if (!target.sessionToken) {
        target.sessionToken = crypto.randomBytes(32).toString("hex")
        saveProjectConfig(config)
        logCrosscode(`Session token generated for ${process.cwd()} (censored: ${censorToken(target.sessionToken)})`)
    } else {
        debug("session token reused from project config", { cwd: process.cwd() })
    }
    return target.sessionToken
}

export function ensureProjectId(config: Config, project?: ProjectConfig): string {
    const target = project ?? getProjectConfig(config)
    if (!target.projectId) {
        target.projectId = crypto.randomBytes(16).toString("hex")
        saveProjectConfig(config)
        logCrosscode(`Project ID generated for ${process.cwd()}: ${target.projectId}`)
    } else {
        debug("project ID reused from project config", { projectId: target.projectId, cwd: process.cwd() })
    }
    return target.projectId
}
