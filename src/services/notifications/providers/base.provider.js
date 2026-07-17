import { DELIVERY_STATUS, NOTIFICATION_CHANNEL } from '../../../constants/enums.js'

/**
 * Base notification delivery provider interface.
 * Implementations must return { status, providerResponse?, error? }.
 */
export class NotificationProvider {
  constructor(channel) {
    this.channel = channel
  }

  getChannel() {
    return this.channel
  }

  isConfigured() {
    return false
  }

  async deliver(_payload) {
    return {
      status: DELIVERY_STATUS.NOT_CONFIGURED,
      error: `${this.channel} provider is not configured`,
    }
  }
}

export { NOTIFICATION_CHANNEL, DELIVERY_STATUS }
