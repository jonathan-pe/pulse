import winston from 'winston'

/**
 * Logger configuration and format setup
 */

const { combine, timestamp, printf, colorize, errors, json } = winston.format

// Custom format for development - human-readable with colors
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`

  // Add stack trace for errors
  if (stack) {
    log += `\n${stack}`
  }

  // Add metadata if present
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
  if (meta) {
    log += `\n${meta}`
  }

  return log
})

// Production format - structured JSON for log aggregation
const prodFormat = combine(timestamp(), errors({ stack: true }), json())

/**
 * Create the Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format:
    process.env.NODE_ENV === 'production'
      ? prodFormat
      : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), devFormat),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
  // Prevent logger from exiting on uncaught errors
  exitOnError: false,
})

/**
 * Typed logger interface for better IDE support
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void
  debug(message: string, meta?: Record<string, unknown>): void
  http(message: string, meta?: Record<string, unknown>): void
}

/**
 * Wrap Winston logger with a cleaner API
 */
export const createLogger = (context?: string): Logger => {
  const contextMeta = context ? { context } : {}

  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { ...contextMeta, ...meta })
    },

    warn: (message: string, meta?: Record<string, unknown>) => {
      logger.warn(message, { ...contextMeta, ...meta })
    },

    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      const errorMeta: Record<string, unknown> = { ...contextMeta, ...meta }

      if (error instanceof Error) {
        errorMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
        logger.error(message, errorMeta)
      } else if (error) {
        errorMeta.error = error
        logger.error(message, errorMeta)
      } else {
        logger.error(message, errorMeta)
      }
    },

    debug: (message: string, meta?: Record<string, unknown>) => {
      logger.debug(message, { ...contextMeta, ...meta })
    },

    http: (message: string, meta?: Record<string, unknown>) => {
      logger.http(message, { ...contextMeta, ...meta })
    },
  }
}

// Default logger instance for general use
export const log = createLogger()

/**
 * Export the underlying Winston logger for advanced use cases
 * (e.g., adding transports, custom formats, etc.)
 */
export const winstonLogger = logger
