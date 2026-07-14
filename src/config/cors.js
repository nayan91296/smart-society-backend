import cors from 'cors'
import env from './env.js'

const corsOptions = {
  origin: env.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const corsMiddleware = cors(corsOptions)

export default corsMiddleware
