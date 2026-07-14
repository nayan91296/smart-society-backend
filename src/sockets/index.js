import { Server } from 'socket.io'
import env from '../config/env.js'
import { setIO } from './socket.manager.js'
import registerConnectionHandlers from './handlers/connection.handler.js'

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  })

  setIO(io)
  registerConnectionHandlers(io)

  return io
}

export default initializeSocket
