const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const

type LogLevelType = typeof LogLevel[keyof typeof LogLevel]

const currentLevel: LogLevelType = LogLevel[process.env.LOG_LEVEL?.toUpperCase() as keyof typeof LogLevel] ?? LogLevel.INFO

function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ""
  return `[${timestamp}] [${level}] ${message}${metaStr}`
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (currentLevel <= LogLevel.DEBUG) {
      console.log(formatMessage("DEBUG", message, meta))
    }
  },

  info(message: string, meta?: Record<string, unknown>) {
    if (currentLevel <= LogLevel.INFO) {
      console.log(formatMessage("INFO", message, meta))
    }
  },

  warn(message: string, meta?: Record<string, unknown>) {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(formatMessage("WARN", message, meta))
    }
  },

  error(message: string, meta?: Record<string, unknown>) {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(formatMessage("ERROR", message, meta))
    }
  },
}
