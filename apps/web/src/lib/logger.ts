const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const
type LogLevel = keyof typeof LOG_LEVELS

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "debug"

function timestamp(): string {
  return new Date().toISOString()
}

function formatLog(level: LogLevel, prefix: string, args: unknown[]): string {
  const ts = timestamp()
  const msg = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ")
  return `[${ts}] [${level.toUpperCase()}] [${prefix}] ${msg}`
}

export const logger = {
  debug(prefix: string, ...args: unknown[]) {
    if (LOG_LEVELS[MIN_LEVEL] <= LOG_LEVELS.debug) {
      console.log(formatLog("debug", prefix, args))
    }
  },
  info(prefix: string, ...args: unknown[]) {
    if (LOG_LEVELS[MIN_LEVEL] <= LOG_LEVELS.info) {
      console.log(formatLog("info", prefix, args))
    }
  },
  warn(prefix: string, ...args: unknown[]) {
    if (LOG_LEVELS[MIN_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(formatLog("warn", prefix, args))
    }
  },
  error(prefix: string, ...args: unknown[]) {
    if (LOG_LEVELS[MIN_LEVEL] <= LOG_LEVELS.error) {
      console.error(formatLog("error", prefix, args))
    }
  },
}
