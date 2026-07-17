import { logger } from '../../helpers/index.js'
import tokenService from '../../services/token.service.js'
import userRepository from '../../repositories/user.repository.js'
import societyRepository from '../../repositories/society.repository.js'
import { ROLES, SOCIETY_STATUS } from '../../constants/index.js'
import { isValidObjectId } from '../../utils/objectId.util.js'

const resolveSocietyRoomId = async (user, handshake) => {
  if (user.role === ROLES.SUPER_ADMIN) {
    const headerId =
      handshake.headers?.['x-society-id'] ||
      handshake.auth?.societyId ||
      null
    const candidate =
      (headerId && isValidObjectId(headerId) ? headerId.toString() : null) ||
      (user.activeSocietyContext ? user.activeSocietyContext.toString() : null)

    if (!candidate) return null

    const society = await societyRepository.findOperationalById(candidate)
    return society ? society._id.toString() : null
  }

  if (!user.society) return null

  const society = await societyRepository.findByIdNotDeleted(user.society)
  if (!society || society.status !== SOCIETY_STATUS.ACTIVE) return null

  return society._id.toString()
}

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
        activeSocietyContext: user.activeSocietyContext
          ? user.activeSocietyContext.toString()
          : null,
      }
      return next()
    } catch {
      return next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.user?.id
    logger.info('Socket connected', { socketId: socket.id, userId })

    if (userId) {
      socket.join(`user:${userId}`)
    }

    try {
      const societyRoomId = await resolveSocietyRoomId(socket.user, socket.handshake)
      if (societyRoomId) {
        socket.join(`society:${societyRoomId}`)
        socket.societyRoomId = societyRoomId
      }
    } catch (error) {
      logger.warn('Socket society room join skipped', {
        socketId: socket.id,
        userId,
        error: error.message,
      })
    }

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId, reason })
    })
  })
}

export default registerConnectionHandlers
