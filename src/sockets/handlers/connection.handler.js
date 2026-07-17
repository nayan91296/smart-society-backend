import { logger } from '../../helpers/index.js'
import tokenService from '../../services/token.service.js'
import userRepository from '../../repositories/user.repository.js'

const registerConnectionHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const payload = tokenService.verifyAccessToken(token)
      const user = await userRepository.findById(payload.sub)

      if (!user || !user.isActive) {
        return next(new Error('Unauthorized'))
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role,
        society: user.society ? user.society.toString() : null,
      }
      return next()
    } catch {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user?.id
    logger.info('Socket connected', { socketId: socket.id, userId })

    if (userId) {
      socket.join(`user:${userId}`)
    }

    if (socket.user?.society) {
      socket.join(`society:${socket.user.society}`)
    }

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId, reason })
    })
  })
}

export default registerConnectionHandlers
