import { DELIVERY_STATUS, NOTIFICATION_CHANNEL } from '../../../constants/enums.js'
import { NotificationProvider } from './base.provider.js'

/**
 * WhatsApp readiness adapter — no external SDK.
 * Always records NOT_CONFIGURED / SKIPPED rather than pretending delivery.
 */
class WhatsAppProvider extends NotificationProvider {
  constructor() {
    super(NOTIFICATION_CHANNEL.WHATSAPP)
  }

  isConfigured() {
    return false
  }

  async deliver({ user }) {
    const prefs = user?.notificationPreferences?.channels?.whatsapp
    if (prefs && prefs.enabled === false) {
      return {
        status: DELIVERY_STATUS.SKIPPED,
        error: 'WhatsApp notifications disabled in user preferences',
      }
    }

    return {
      status: DELIVERY_STATUS.NOT_CONFIGURED,
      error: 'WhatsApp provider is not configured',
      providerResponse: { ready: false, sdk: null },
    }
  }
}

export default new WhatsAppProvider()
