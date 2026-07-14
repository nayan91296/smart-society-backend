import { logger } from '../../helpers/index.js'

const registerConnectionHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id })

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason })
    })
  })
}

export default registerConnectionHandlers
