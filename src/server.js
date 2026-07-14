import http from 'node:http'
import app from './app.js'
import { env, connectDatabase, disconnectDatabase } from './config/index.js'
import { logger } from './helpers/index.js'
import initializeSocket from './sockets/index.js'

const startServer = async () => {
  await connectDatabase()

  const httpServer = http.createServer(app)
  initializeSocket(httpServer)

  const server = httpServer.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`)
    logger.info(`API available at http://localhost:${env.port}${env.apiPrefix}`)
  })

  const gracefulShutdown = async (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`)

    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
}

startServer().catch((error) => {
  logger.error('Failed to start server', { message: error.message })
  process.exit(1)
})
