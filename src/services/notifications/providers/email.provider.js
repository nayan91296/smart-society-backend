import emailService from '../../email.service.js'
import env from '../../../config/env.js'
import { DELIVERY_STATUS, NOTIFICATION_CHANNEL } from '../../../constants/enums.js'
import { logger } from '../../../helpers/index.js'
import { NotificationProvider } from './base.provider.js'

class EmailProvider extends NotificationProvider {
  constructor() {
    super(NOTIFICATION_CHANNEL.EMAIL)
  }

  isConfigured() {
    return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass)
  }

  async deliver({ notification, user }) {
    if (!user?.email) {
      return {
        status: DELIVERY_STATUS.SKIPPED,
        error: 'User has no email address',
      }
    }

    try {
      const result = await emailService.sendMail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
        html: `<p>${notification.message}</p>`,
      })

      return {
        status: DELIVERY_STATUS.SENT,
        providerResponse: {
          messageId: result?.messageId || null,
          configured: this.isConfigured(),
        },
      }
    } catch (error) {
      logger.error('Email notification delivery failed', { error: error.message })
      return {
        status: DELIVERY_STATUS.FAILED,
        error: error.message,
      }
    }
  }
}

export default new EmailProvider()
