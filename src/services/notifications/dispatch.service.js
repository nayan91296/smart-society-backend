import inAppProvider from './providers/inApp.provider.js'
import emailProvider from './providers/email.provider.js'
import pushProvider from './providers/push.provider.js'
import whatsappProvider from './providers/whatsapp.provider.js'
import notificationRepository from '../../repositories/notification.repository.js'
import userRepository from '../../repositories/user.repository.js'
import societyRepository from '../../repositories/society.repository.js'
import {
  DELIVERY_STATUS,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
} from '../../constants/enums.js'
import { logger } from '../../helpers/index.js'

const providers = {
  [NOTIFICATION_CHANNEL.IN_APP]: inAppProvider,
  [NOTIFICATION_CHANNEL.EMAIL]: emailProvider,
  [NOTIFICATION_CHANNEL.PUSH]: pushProvider,
  [NOTIFICATION_CHANNEL.WHATSAPP]: whatsappProvider,
}

const channelPrefKey = {
  [NOTIFICATION_CHANNEL.IN_APP]: 'inApp',
  [NOTIFICATION_CHANNEL.EMAIL]: 'email',
  [NOTIFICATION_CHANNEL.PUSH]: 'push',
  [NOTIFICATION_CHANNEL.WHATSAPP]: 'whatsapp',
}

class NotificationDispatchService {
  getProviderStatus() {
    return Object.values(NOTIFICATION_CHANNEL).map((channel) => {
      const provider = providers[channel]
      return {
        channel,
        configured: provider.isConfigured(),
        ready: provider.isConfigured(),
      }
    })
  }

  async dispatchToUser({
    userId,
    societyId = null,
    title,
    message,
    type = NOTIFICATION_TYPE.INFO,
    data = {},
    entityType = null,
    entityId = null,
    channels = [NOTIFICATION_CHANNEL.IN_APP],
    createdBy = null,
  }) {
    const user = await userRepository.findById(userId)
    if (!user || !user.isActive) {
      return null
    }

    const mutedTypes = user.notificationPreferences?.mutedTypes || []
    if (mutedTypes.includes(type)) {
      logger.info('Notification skipped — type muted', { userId, type })
      return null
    }

    const requestedChannels = [...new Set(channels.length ? channels : [NOTIFICATION_CHANNEL.IN_APP])]
    const allowedChannels = await this.#filterChannels(user, societyId, requestedChannels)

    if (!allowedChannels.length) {
      return null
    }

    const notification = await notificationRepository.create({
      society: societyId,
      user: user._id,
      title,
      message,
      type,
      data,
      entityType,
      entityId,
      channels: allowedChannels,
      deliveries: [],
      createdBy,
      isRead: false,
    })

    const deliveries = []
    for (const channel of allowedChannels) {
      const provider = providers[channel]
      const attemptedAt = new Date()
      let result
      try {
        result = await provider.deliver({ notification, user })
      } catch (error) {
        result = { status: DELIVERY_STATUS.FAILED, error: error.message }
      }

      deliveries.push({
        channel,
        status: result.status,
        attemptedAt,
        completedAt: new Date(),
        error: result.error || null,
        providerResponse: result.providerResponse || null,
      })
    }

    notification.deliveries = deliveries
    await notification.save()

    return notification
  }

  async dispatchToUsers(userIds, payload) {
    const results = []
    for (const userId of userIds) {
      const notification = await this.dispatchToUser({ ...payload, userId })
      if (notification) results.push(notification)
    }
    return results
  }

  async #filterChannels(user, societyId, channels) {
    let societySettings = null
    if (societyId) {
      const society = await societyRepository.findActiveById(societyId)
      societySettings = society?.settings?.notifications || null
    }

    return channels.filter((channel) => {
      const prefKey = channelPrefKey[channel]
      const userChannel = user.notificationPreferences?.channels?.[prefKey]
      if (userChannel && userChannel.enabled === false) {
        return false
      }

      if (societySettings) {
        if (channel === NOTIFICATION_CHANNEL.EMAIL && societySettings.emailEnabled === false) {
          return false
        }
        if (channel === NOTIFICATION_CHANNEL.PUSH && societySettings.pushEnabled === false) {
          return false
        }
        if (channel === NOTIFICATION_CHANNEL.WHATSAPP && societySettings.whatsappEnabled === false) {
          return false
        }
      }

      return true
    })
  }
}

export default new NotificationDispatchService()
