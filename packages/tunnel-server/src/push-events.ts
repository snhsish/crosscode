import { sendExpoPush, type PushEventKind } from "./db.js"
import { logger } from "./logger.js"

type SseEvent = {
  type: string
  properties?: Record<string, unknown>
}

const sent = new Set<string>()

function getEventPayload(parsed: unknown): SseEvent | null {
  if (!parsed || typeof parsed !== "object") return null
  const candidate = parsed as { type?: unknown; payload?: unknown; properties?: unknown }
  if (candidate.payload && typeof candidate.payload === "object" && !candidate.type) {
    return candidate.payload as SseEvent
  }
  return candidate as SseEvent
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "The agent stopped because it hit an error."
  const data = (error as { data?: unknown }).data
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message
  }
  return "The agent stopped because it hit an error."
}

async function deliver(
  userId: string,
  kind: PushEventKind,
  key: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
) {
  if (sent.has(key)) return
  sent.add(key)
  await sendExpoPush(userId, kind, title, body, { ...data, notificationKey: key, kind })
}

export function createSsePushObserver(userId: string, projectId: string) {
  let buffer = ""
  let lastCompleted: {
    messageId: string
    sessionId: string
    hasError: boolean
    errorMessage: string
  } | null = null

  function inspectEvent(event: SseEvent) {
    const props = event.properties ?? {}
    const sessionId = typeof props.sessionID === "string" ? props.sessionID : undefined

    if (event.type === "message.updated") {
      const info = props.info as Record<string, unknown> | undefined
      if (!info || info.role !== "assistant") return
      const messageId = typeof info.id === "string" ? info.id : undefined
      const infoSessionId = typeof info.sessionID === "string" ? info.sessionID : sessionId
      const time = info.time as { completed?: unknown } | undefined
      if (!messageId || !infoSessionId || typeof time?.completed !== "number") return

      lastCompleted = {
        messageId,
        sessionId: infoSessionId,
        hasError: !!info.error,
        errorMessage: info.error ? errorMessage(info.error) : "",
      }
      return
    }

    if (event.type === "session.idle") {
      if (!lastCompleted) return
      const { messageId, sessionId: sid, hasError, errorMessage: errMsg } = lastCompleted
      lastCompleted = null

      if (hasError) {
        deliver(
          userId,
          "error",
          `${sid}:error:${messageId}`,
          "Agent response failed",
          errMsg,
          { tunnelProjectId: projectId, sessionId: sid, messageId },
        )
      } else {
        deliver(
          userId,
          "completion",
          `${sid}:completion:${messageId}`,
          "Agent response completed",
          "The agent finished responding.",
          { tunnelProjectId: projectId, sessionId: sid, messageId },
        )
      }
      return
    }

    if (event.type === "permission.asked") {
      const requestId = typeof props.id === "string" ? props.id : undefined
      if (!sessionId || !requestId) return
      const permission = typeof props.permission === "string" ? props.permission : "Review the pending permission request."
      deliver(
        userId,
        "permission",
        `${sessionId}:permission:${requestId}`,
        "Agent needs permission",
        permission,
        { tunnelProjectId: projectId, sessionId, requestId },
      )
    }
  }

  return {
    write(chunk: Buffer) {
      buffer += chunk.toString("utf8")
      const events = buffer.split("\n\n")
      buffer = events.pop() ?? ""

      for (const eventBlock of events) {
        const dataLines = eventBlock
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())

        if (dataLines.length === 0) continue

        try {
          const parsed = JSON.parse(dataLines.join("\n"))
          const event = getEventPayload(parsed)
          if (event?.type) inspectEvent(event)
        } catch (err) {
          logger.debug("Skipping malformed SSE push event", {
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }
    },
  }
}

export function createQuestionPushObserver(userId: string, projectId: string) {
  const chunks: Buffer[] = []

  return {
    write(chunk: Buffer) {
      chunks.push(chunk)
    },
    end() {
      if (chunks.length === 0) return

      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"))
        if (!Array.isArray(parsed)) return

        for (const question of parsed) {
          if (!question || typeof question !== "object") continue
          const request = question as {
            id?: unknown
            sessionID?: unknown
            questions?: Array<{ question?: unknown }>
          }
          if (typeof request.id !== "string" || typeof request.sessionID !== "string") continue

          const firstQuestion = request.questions?.[0]?.question
          deliver(
            userId,
            "question",
            `${request.sessionID}:question:${request.id}`,
            "Agent has a question",
            typeof firstQuestion === "string" && firstQuestion.trim()
              ? firstQuestion
              : "The agent is waiting for your answer.",
            { tunnelProjectId: projectId, sessionId: request.sessionID, requestId: request.id },
          )
        }
      } catch (err) {
        logger.debug("Skipping malformed question push response", {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    },
  }
}
