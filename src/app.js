import express from 'express'
import cookieParser from 'cookie-parser'
import {
  env,
  corsMiddleware,
  helmetConfig,
  morganConfig,
  compressionConfig,
  globalRateLimiter,
  apiRateLimiter,
} from './config/index.js'
import v1Routes from './routes/v1/index.js'
import { errorHandler, notFound } from './middlewares/index.js'

const app = express()

// Security & performance middleware
app.use(helmetConfig)
app.use(corsMiddleware)
app.use(compressionConfig)
app.use(globalRateLimiter)
app.use(morganConfig)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// API routes
app.use(env.apiPrefix, apiRateLimiter, v1Routes)

// Error handling
app.use(notFound)
app.use(errorHandler)

export default app
