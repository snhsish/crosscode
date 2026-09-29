import http from "http"
import { debug, censorAuth } from "./util"
import { handleGitRequest } from "./git-handler"
import type { OpencodeMajor } from "./opencode-version"

const MAX_BODY_SIZE = 10 * 1024 * 1024
const HOP_BY_HOP = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-authenticate", "proxy-authorization", "te", "trailer"])

export const proxyAgent = new http.Agent({ keepAlive: true, maxSockets: 50 })

export function sanitizeUrlPath(url: string | undefined): string {
    if (!url || url.length === 0) return "/"
    const fragmentIndex = url.indexOf("#")
    const withoutFragment = fragmentIndex === -1 ? url : url.slice(0, fragmentIndex)
    const queryIndex = withoutFragment.indexOf("?")
    const rawPath = queryIndex === -1 ? withoutFragment : withoutFragment.slice(0, queryIndex)
    const rawQuery = queryIndex === -1 ? "" : withoutFragment.slice(queryIndex + 1)
    if (!rawPath.startsWith("/")) return "/"
    const cleaned = rawPath.replace(/\/+/g, "/")
    let decoded: string
    try {
        decoded = decodeURIComponent(cleaned)
    } catch {
        return "/"
    }
    if (decoded.includes("..") || decoded.includes("@") || decoded.includes("\\")) return "/"
    return `${cleaned || "/"}${rawQuery ? `?${rawQuery}` : ""}`
}

export function createOpencodeProxy(targetPort: number, sessionToken: string, logPrefix: string, serverVersion: OpencodeMajor = 1): http.Server {
    // v2 moved the API under /api/*
    const eventPath = serverVersion >= 2 ? "/api/event" : "/event"
    return http.createServer(async (req, res) => {
        const safePath = sanitizeUrlPath(req.url)
        const targetUrl = `http://127.0.0.1:${targetPort}${safePath}`
        const authHeader = req.headers["authorization"]

        debug(`${logPrefix} request received`, {
            method: req.method,
            url: req.url,
            safePath,
            hasAuth: !!authHeader,
            auth: censorAuth(authHeader),
        })

        if (req.method === "OPTIONS") {
            debug("handling CORS preflight")
            res.writeHead(204, {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
            })
            res.end()
            return
        }

        if (req.url === "/mobile-event" && req.method === "POST") {
            debug("handling SSE request")
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            })

            let sseAuth = authHeader || ""
            if (sseAuth && !sseAuth.startsWith("Basic ")) {
                sseAuth = `Basic ${Buffer.from(`:${sseAuth}`).toString("base64")}`
                debug("converted SSE auth to Basic format")
            }

            const sseReq = http.get(`http://127.0.0.1:${targetPort}${eventPath}`, {
                headers: {
                    "Accept": "text/event-stream",
                    "Authorization": sseAuth,
                },
            }, (sseRes) => {
                debug("SSE upstream connected", { status: sseRes.statusCode })
                sseRes.on("data", (chunk) => { res.write(chunk) })
                sseRes.on("end", () => { debug("SSE upstream ended"); res.end() })
            })

            sseReq.on("error", (err) => {
                debug("SSE upstream error", { error: err.message })
                res.end()
            })

            req.on("close", () => {
                debug("SSE client disconnected")
                sseReq.destroy()
            })

            return
        }

        if (await handleGitRequest(req, res, { worktree: process.cwd(), sessionToken })) {
            return
        }

        const forwardHeaders: Record<string, string | string[]> = {}
        for (const [key, value] of Object.entries(req.headers)) {
            if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) forwardHeaders[key] = value
        }
        forwardHeaders["host"] = `127.0.0.1:${targetPort}`

        if (authHeader && !authHeader.startsWith("Basic ")) {
            forwardHeaders["authorization"] = `Basic ${Buffer.from(`:${authHeader}`).toString("base64")}`
            debug("converted auth to Basic format")
        }

        debug("forwarding to opencode", {
            targetUrl,
            method: req.method,
            hasAuth: !!forwardHeaders["authorization"],
            auth: censorAuth(forwardHeaders["authorization"] as string),
        })

        const proxyReq = http.request(targetUrl, {
            method: req.method,
            headers: forwardHeaders,
            agent: proxyAgent,
        }, (proxyRes) => {
            debug("opencode responded", { status: proxyRes.statusCode, method: req.method, path: safePath })
            res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
            proxyRes.pipe(res)
        })

        proxyReq.on("error", (err) => {
            debug("proxy request error", { error: err.message })
            if (!res.headersSent) {
                res.writeHead(502)
                res.end("Bad Gateway")
            }
        })

        let bodySize = 0
        let bodyTooLarge = false

        req.on("data", (chunk) => {
            bodySize += chunk.length
            if (bodySize > MAX_BODY_SIZE) {
                bodyTooLarge = true
                debug("request body too large", { size: bodySize, max: MAX_BODY_SIZE })
                req.destroy()
                proxyReq.destroy()
                if (!res.headersSent) {
                    res.writeHead(413)
                    res.end("Request body too large")
                }
                return
            }
            proxyReq.write(chunk)
        })

        // Fix I7: guard against calling end() on a destroyed proxyReq
        req.on("end", () => {
            if (!bodyTooLarge && !proxyReq.destroyed) proxyReq.end()
        })

        req.on("error", (err) => {
            debug("request stream error", { error: err.message })
            proxyReq.destroy()
            if (!res.headersSent) {
                res.writeHead(500)
                res.end("Internal Server Error")
            }
        })
    })
}
