import { DELIVERY_STATUS, NOTIFICATION_CHANNEL } from '../../../constants/enums.js'
import { NotificationProvider } from './base.provider.js'

/**
 * Push readiness adapter — no external SDK.
 * Always records NOT_CONFIGURED / SKIPPED rather than pretending delivery.
 */
class PushProvider extends NotificationProvider {
  constructor() {
    super(NOTIFICATION_CHANNEL.PUSH)
  }

  isConfigured() {
    return false
  }

  async deliver({ user }) {
    const prefs = user?.notificationPreferences?.channels?.push
    if (prefs && prefs.enabled === false) {
      return {
        status: DELIVERY_STATUS.SKIPPED,
        error: 'Push notifications disabled in user preferences',
      }
    }

    return {
      status: DELIVERY_STATUS.NOT_CONFIGURED,
      error: 'Push notification provider is not configured',
      providerResponse: { ready: false, sdk: null },
    }
  }
}

export default new PushProvider()
