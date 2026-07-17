import { DELIVERY_STATUS, NOTIFICATION_CHANNEL } from '../../../constants/enums.js'
import { getIO } from '../../../sockets/socket.manager.js'
import { logger } from '../../../helpers/index.js'
import { NotificationProvider } from './base.provider.js'

class InAppProvider extends NotificationProvider {
  constructor() {
    super(NOTIFICATION_CHANNEL.IN_APP)
  }

  isConfigured() {
    return true
  }

  async deliver({ notification, user }) {
    try {
      const io = getIO()
      io.to(`user:${user._id?.toString?.() || user.id}`).emit('notification', {
        id: notification._id?.toString?.() || notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data || {},
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      })
    } catch (error) {
      logger.info('Socket emit skipped (io not ready)', { error: error.message })
    }

    return {
      status: DELIVERY_STATUS.SENT,
      providerResponse: { persisted: true },
    }
  }
}

export default new InAppProvider()
