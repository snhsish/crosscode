import AsyncStorage from "@react-native-async-storage/async-storage"
import { DAILY_HISTORY_LIMIT, type DailyBucket, todayKey } from "@/store/opencode-stats.store"

const CONNECTIONS_KEY = "crosscode-connections"
const SESSIONS_KEY = "crosscode-sessions"
const STATS_KEY = "crosscode-opencode-stats"
const QUESTIONS_KEY = "crosscode-questions"

type Persisted<T> = { state: T }

interface Connection {
  id: string
  url: string
  name: string
  healthy?: boolean | null
}

interface SessionSummary {
  additions: number
  deletions: number
  files: number
}

interface Session {
  id: string
  projectID: string
  directory: string
  title: string
  agent?: string
  time: { created: number; updated: number }
  summary?: SessionSummary
}

interface ProjectStats {
  projectId: string
  projectName: string
  responseCount: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  lastResponseAt: string | null
  dailyHistory?: Record<string, DailyBucket>
}

async function readPersisted<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Persisted<T>
    return parsed?.state
  } catch {
    return undefined
  }
}

function last7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export interface ProjectWidgetData {
  id: string
  name: string
  responseCount: number
  inputTokens: number
  outputTokens: number
  cost: number
  lastResponseAt: string | null
  /** Output tokens per day for the trailing 7 days (oldest -> newest). */
  weekOutputTokens: number[]
}

export interface WidgetData {
  connected: boolean
  serverName: string
  hasSession: boolean
  sessionTitle: string
  sessionAgent: string
  sessionAdditions: number
  sessionDeletions: number
  sessionFiles: number
  sessionUpdatedAt: number | null
  pendingQuestions: number
  todayInputTokens: number
  todayOutputTokens: number
  todayCost: number
  weekOutputTokens: number[]
  projects: ProjectWidgetData[]
}

export async function buildWidgetData(): Promise<WidgetData> {
  const [connections, sessions, stats, questions] = await Promise.all([
    readPersisted<{ connections: Connection[]; current: string | null }>(CONNECTIONS_KEY),
    readPersisted<Session[]>(SESSIONS_KEY),
    readPersisted<Record<string, ProjectStats>>(STATS_KEY),
    readPersisted<{ questionsBySession: Record<string, unknown[]> }>(QUESTIONS_KEY),
  ])

  const currentId = connections?.current
  const current =
    connections?.connections.find((c) => c.id === currentId) ??
    connections?.connections[0]
  const connected = Boolean(current && current.healthy !== false && current.url)

  const allSessions = sessions ?? []
  const activeSession = allSessions.length
    ? [...allSessions].sort((a, b) => b.time.updated - a.time.updated)[0]
    : undefined

  const pendingQuestions = questions
    ? Object.values(questions.questionsBySession ?? {}).reduce<number>(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
        0
      )
    : 0

  const days = last7Days()
  const today = todayKey()
  const projectsMap = stats ?? {}
  const projects: ProjectWidgetData[] = Object.values(projectsMap)
    .map((p) => ({
      id: p.projectId,
      name: p.projectName,
      responseCount: p.responseCount,
      inputTokens: p.totalInputTokens,
      outputTokens: p.totalOutputTokens,
      cost: p.totalCost,
      lastResponseAt: p.lastResponseAt,
      weekOutputTokens: days.map((d) => p.dailyHistory?.[d]?.outputTokens ?? 0),
    }))
    .sort((a, b) => (b.lastResponseAt ?? "").localeCompare(a.lastResponseAt ?? ""))
    .slice(0, 5)

  const globalHistory: Record<string, DailyBucket> = {}
  for (const p of Object.values(projectsMap)) {
    for (const [day, bucket] of Object.entries(p.dailyHistory ?? {})) {
      const agg = globalHistory[day] ?? {
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        responses: 0,
      }
      agg.inputTokens += bucket.inputTokens
      agg.outputTokens += bucket.outputTokens
      agg.cost += bucket.cost
      agg.responses += bucket.responses
      globalHistory[day] = agg
    }
  }

  const todayBucket = globalHistory[today] ?? {
    inputTokens: 0,
    outputTokens: 0,
    cost: 0,
    responses: 0,
  }

  return {
    connected: Boolean(connected),
    serverName: current?.name ?? "",
    hasSession: Boolean(activeSession),
    sessionTitle: activeSession?.title ?? "",
    sessionAgent: activeSession?.agent ?? "",
    sessionAdditions: activeSession?.summary?.additions ?? 0,
    sessionDeletions: activeSession?.summary?.deletions ?? 0,
    sessionFiles: activeSession?.summary?.files ?? 0,
    sessionUpdatedAt: activeSession?.time.updated ?? null,
    pendingQuestions,
    todayInputTokens: todayBucket.inputTokens,
    todayOutputTokens: todayBucket.outputTokens,
    todayCost: todayBucket.cost,
    weekOutputTokens: days.map((d) => globalHistory[d]?.outputTokens ?? 0),
    projects,
  }
}

export const WIDGET_DAILY_HISTORY_LIMIT = DAILY_HISTORY_LIMIT
