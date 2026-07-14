import env from '../config/env.js'

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString()
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`
}

const logger = {
  info: (message, meta) => {
    if (env.isDev) {
      console.info(formatMessage('info', message, meta))
    }
  },
  warn: (message, meta) => {
    console.warn(formatMessage('warn', message, meta))
  },
  error: (message, meta) => {
    console.error(formatMessage('error', message, meta))
  },
  debug: (message, meta) => {
    if (env.isDev) {
      console.info(formatMessage('debug', message, meta))
    }
  },
}

export default logger
