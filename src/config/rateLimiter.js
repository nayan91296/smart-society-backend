import rateLimit from 'express-rate-limit'
import env from './env.js'
import { MESSAGES } from '../constants/index.js'
import { HTTP_STATUS } from '../constants/index.js'

const globalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
})

const apiRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.apiMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
})

export { globalRateLimiter, apiRateLimiter }
