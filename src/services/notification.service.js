import notificationRepository from '../repositories/notification.repository.js'
import userRepository from '../repositories/user.repository.js'
import memberRepository from '../repositories/member.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import notificationDispatchService from './notifications/dispatch.service.js'
import { getPagination, getPaginationMeta, sanitizeNotification } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
  ROLES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

class NotificationService {
  async listMine(userId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.isRead !== undefined && query.isRead !== '') {
      filter.isRead = query.isRead === true || query.isRead === 'true'
    }
    if (query.type) filter.type = query.type

    const result = await notificationRepository.searchForUser({
      userId,
      filter,
      page,
      limit,
    })

    return {
      notifications: result.data.map(sanitizeNotification),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async unreadCount(userId) {
    const count = await notificationRepository.countUnread(userId)
    return { count }
  }

  async getMine(userId, id) {
    const notification = await notificationRepository.findForUser(userId, id)
    if (!notification) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found')
    }
    return sanitizeNotification(notification)
  }

  async markRead(userId, id) {
    let notification = await notificationRepository.markRead(userId, id)
    if (!notification) {
      notification = await notificationRepository.findForUser(userId, id)
      if (!notification) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found')
      }
    }
    return sanitizeNotification(notification)
  }

  async markAllRead(userId) {
    const result = await notificationRepository.markAllRead(userId)
    return {
      message: MESSAGES.UPDATED,
      modifiedCount: result.modifiedCount || 0,
    }
  }

  async send(societyId, payload, actor, meta = {}) {
    const channels = payload.channels?.length
      ? payload.channels
      : [NOTIFICATION_CHANNEL.IN_APP]

    const userIds = new Set()

    if (payload.userId) {
      const user = await userRepository.findById(payload.userId)
      if (!user || (user.society && user.society.toString() !== societyId)) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found in this society')
      }
      userIds.add(user._id.toString())
    }

    if (payload.memberId) {
      const member = await memberRepository.findInSociety(payload.memberId, societyId)
      if (!member) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
      }
      if (!member.user) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Member has no linked user account')
      }
      userIds.add(member.user.toString())
    }

    if (!userIds.size) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'userId or memberId is required')
    }

    const notifications = await notificationDispatchService.dispatchToUsers([...userIds], {
      societyId,
      title: payload.title,
      message: payload.message,
      type: payload.type || NOTIFICATION_TYPE.INFO,
      data: payload.data || {},
      entityType: payload.entityType,
      entityId: payload.entityId,
      channels,
      createdBy: actor.id,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Notification',
      description: `Notification sent to ${userIds.size} user(s)`,
      metadata: { title: payload.title, userIds: [...userIds] },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return {
      sent: notifications.length,
      notifications: notifications.map(sanitizeNotification),
    }
  }

  async broadcast(societyId, payload, actor, meta = {}) {
    const channels = payload.channels?.length
      ? payload.channels
      : [NOTIFICATION_CHANNEL.IN_APP]

    const roles = payload.roles?.length ? payload.roles : [ROLES.MEMBER, ROLES.SOCIETY_ADMIN]
    if (roles.includes(ROLES.SUPER_ADMIN)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot broadcast to SUPER_ADMIN')
    }

    const users = await userRepository.find({
      society: societyId,
      role: { $in: roles },
      isActive: true,
      isDeleted: false,
    })

    const notifications = await notificationDispatchService.dispatchToUsers(
      users.map((u) => u._id.toString()),
      {
        societyId,
        title: payload.title,
        message: payload.message,
        type: payload.type || NOTIFICATION_TYPE.SYSTEM,
        data: payload.data || {},
        channels,
        createdBy: actor.id,
      },
    )

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Notification',
      description: `Broadcast notification to ${users.length} user(s)`,
      metadata: { title: payload.title, roles },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return {
      targeted: users.length,
      sent: notifications.length,
      providerStatus: notificationDispatchService.getProviderStatus(),
    }
  }

  getProviderStatus() {
    return { providers: notificationDispatchService.getProviderStatus() }
  }
}

export default new NotificationService()
