import societyRepository from '../repositories/society.repository.js'
import userRepository from '../repositories/user.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import tokenService from './token.service.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_TYPE,
  ROLES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const SETTINGS_KEYS = [
  'timezone',
  'currency',
  'maintenanceDueDay',
  'visitorPreApprovalRequired',
  'allowMemberVisitorCreation',
  'allowMemberComplaintCreation',
  'allowMemberVehicleRegistration',
  'parkingAutoAssign',
  'invoicePrefix',
  'notifications',
]

const sanitizeSocietySettings = (society) => {
  const doc = society.toJSON ? society.toJSON() : society
  return {
    societyId: doc._id?.toString?.() || doc.id,
    name: doc.name,
    code: doc.code,
    settings: doc.settings || {},
  }
}

const sanitizeProfile = (user) => {
  const userObj = user.toJSON ? user.toJSON() : user
  return {
    id: userObj._id?.toString?.() || userObj.id,
    firstName: userObj.firstName,
    lastName: userObj.lastName,
    email: userObj.email,
    phone: userObj.phone ?? null,
    role: userObj.role,
    society: userObj.society ?? null,
    avatarUrl: userObj.avatarUrl ?? null,
    isActive: userObj.isActive,
    notificationPreferences: userObj.notificationPreferences || {
      channels: {
        inApp: { enabled: true },
        email: { enabled: true },
        push: { enabled: false },
        whatsapp: { enabled: false },
      },
      mutedTypes: [],
    },
    lastLogin: userObj.lastLogin,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
  }
}

class SettingsService {
  async getSocietySettings(societyId) {
    const society = await societyRepository.findActiveById(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }
    return sanitizeSocietySettings(society)
  }

  async updateSocietySettings(societyId, payload, actor, meta = {}) {
    const society = await societyRepository.findActiveById(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    const current = society.settings?.toObject?.() || society.settings || {}
    const next = { ...current }

    for (const key of SETTINGS_KEYS) {
      if (payload[key] === undefined) continue
      if (key === 'notifications' && payload.notifications) {
        next.notifications = {
          ...(current.notifications || {}),
          ...payload.notifications,
        }
      } else {
        next[key] = payload[key]
      }
    }

    society.settings = next
    await society.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Society',
      entityId: society._id,
      description: 'Society settings updated',
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeSocietySettings(society)
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }
    return sanitizeProfile(user)
  }

  async updateProfile(userId, payload, meta = {}) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (payload.firstName !== undefined) user.firstName = payload.firstName
    if (payload.lastName !== undefined) user.lastName = payload.lastName
    if (payload.phone !== undefined) user.phone = payload.phone
    if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl

    if (payload.email !== undefined && payload.email.toLowerCase() !== user.email) {
      const existing = await userRepository.findByEmail(payload.email)
      if (existing && existing._id.toString() !== user._id.toString()) {
        throw new ApiError(HTTP_STATUS.CONFLICT, MESSAGES.EMAIL_ALREADY_EXISTS)
      }
      user.email = payload.email.toLowerCase()
    }

    await user.save()

    await activityLogRepository.log({
      society: user.society,
      user: userId,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id,
      description: 'User profile updated',
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeProfile(user)
  }

  async getNotificationPreferences(userId) {
    const profile = await this.getProfile(userId)
    return { notificationPreferences: profile.notificationPreferences }
  }

  async updateNotificationPreferences(userId, payload, meta = {}) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    const current =
      user.notificationPreferences?.toObject?.() ||
      user.notificationPreferences || {
        channels: {
          inApp: { enabled: true },
          email: { enabled: true },
          push: { enabled: false },
          whatsapp: { enabled: false },
        },
        mutedTypes: [],
      }

    const next = {
      channels: {
        inApp: { enabled: current.channels?.inApp?.enabled !== false },
        email: { enabled: current.channels?.email?.enabled !== false },
        push: { enabled: Boolean(current.channels?.push?.enabled) },
        whatsapp: { enabled: Boolean(current.channels?.whatsapp?.enabled) },
      },
      mutedTypes: [...(current.mutedTypes || [])],
    }

    if (payload.channels) {
      for (const key of ['inApp', 'email', 'push', 'whatsapp']) {
        if (payload.channels[key]?.enabled !== undefined) {
          next.channels[key].enabled = Boolean(payload.channels[key].enabled)
        }
      }
    }

    if (payload.mutedTypes !== undefined) {
      const validTypes = Object.values(NOTIFICATION_TYPE)
      next.mutedTypes = (payload.mutedTypes || []).filter((t) => validTypes.includes(t))
    }

    user.notificationPreferences = next
    await user.save()

    await activityLogRepository.log({
      society: user.society,
      user: userId,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id,
      description: 'Notification preferences updated',
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { notificationPreferences: next }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.CURRENT_PASSWORD_INCORRECT)
    }

    if (currentPassword === newPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.PASSWORD_SAME)
    }

    user.password = newPassword
    await user.save()
    await tokenService.revokeAllUserTokens(user._id)

    return { message: MESSAGES.PASSWORD_CHANGED }
  }

  async logoutAllSessions(userId) {
    await tokenService.revokeAllUserTokens(userId)
    return { message: 'All sessions revoked successfully' }
  }

  async listSocietyUsers(societyId, query = {}) {
    const filter = {
      society: societyId,
      isDeleted: false,
      role: { $ne: ROLES.SUPER_ADMIN },
    }

    if (query.role) {
      if (query.role === ROLES.SUPER_ADMIN) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot list SUPER_ADMIN users')
      }
      filter.role = query.role
    }

    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === true || query.isActive === 'true'
    }

    const users = await userRepository.model
      .find(filter)
      .select('firstName lastName email phone role isActive lastLogin createdAt')
      .sort({ createdAt: -1 })
      .limit(200)

    return {
      users: users.map((u) => ({
        id: u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone ?? null,
        role: u.role,
        isActive: u.isActive,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
      })),
    }
  }

  async updateSocietyUser(societyId, userId, payload, actor, meta = {}) {
    if (userId === actor.id && payload.isActive === false) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot deactivate your own account')
    }

    const user = await userRepository.model.findOne({
      _id: userId,
      society: societyId,
      isDeleted: false,
    })

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot manage SUPER_ADMIN users')
    }

    if (payload.role !== undefined) {
      if (payload.role === ROLES.SUPER_ADMIN) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot assign SUPER_ADMIN role')
      }
      if (![ROLES.SOCIETY_ADMIN, ROLES.MEMBER].includes(payload.role)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid role')
      }
      // Society admin cannot escalate another admin beyond MEMBER/SOCIETY_ADMIN (already constrained)
      user.role = payload.role
    }

    if (payload.isActive !== undefined) user.isActive = payload.isActive
    if (payload.firstName !== undefined) user.firstName = payload.firstName
    if (payload.lastName !== undefined) user.lastName = payload.lastName
    if (payload.phone !== undefined) user.phone = payload.phone

    await user.save()

    if (payload.isActive === false) {
      await tokenService.revokeAllUserTokens(user._id)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id,
      description: `Society user ${user.email} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role,
        isActive: user.isActive,
      },
    }
  }
}

export default new SettingsService()
