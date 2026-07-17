import userRepository from '../repositories/user.repository.js'
import wingRepository from '../repositories/wing.repository.js'
import memberRepository from '../repositories/member.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import tokenService from './token.service.js'
import { getRefId } from '../helpers/wingScope.helper.js'
import { ACTIVITY_ACTION, HTTP_STATUS, MESSAGES, ROLES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const sanitizeSecretaryUser = (user) => {
  const doc = user.toJSON ? user.toJSON() : user
  return {
    id: doc._id?.toString?.() || doc.id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone ?? null,
    role: doc.role,
    society: doc.society,
    managedWing: doc.managedWing
      ? getRefId(doc.managedWing)
      : null,
    isActive: doc.isActive,
  }
}

class WingSecretaryService {
  async get(societyId, wingId) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const secretary = await userRepository.model.findOne({
      society: societyId,
      role: ROLES.WING_SECRETARY,
      managedWing: wingId,
      isDeleted: false,
    })

    return {
      wing: {
        id: wing._id.toString(),
        name: wing.name,
        code: wing.code,
      },
      secretary: secretary ? sanitizeSecretaryUser(secretary) : null,
    }
  }

  async promote(societyId, wingId, { userId }, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const existingSecretary = await userRepository.model.findOne({
      society: societyId,
      role: ROLES.WING_SECRETARY,
      managedWing: wingId,
      isDeleted: false,
    })
    if (existingSecretary) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'This wing already has a Wing Secretary assigned',
      )
    }

    const user = await userRepository.model.findOne({
      _id: userId,
      society: societyId,
      isDeleted: false,
    })
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (user.role !== ROLES.MEMBER) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Only MEMBER accounts can be promoted to WING_SECRETARY',
      )
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot promote an inactive user')
    }

    const member = await memberRepository.model
      .findOne({
        user: userId,
        society: societyId,
        isDeleted: false,
        isActive: true,
      })
      .populate('flat')

    if (!member) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'User must be linked to an active member profile in this society',
      )
    }

    const flatId = getRefId(member.flat)
    const flat =
      member.flat && typeof member.flat === 'object' && member.flat.wing
        ? member.flat
        : await flatRepository.findInSociety(flatId, societyId)

    if (!flat) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Member flat not found')
    }

    if (getRefId(flat.wing) !== String(wingId)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Member flat must belong to the target wing',
      )
    }

    user.role = ROLES.WING_SECRETARY
    user.managedWing = wingId
    await user.save()

    await tokenService.revokeAllUserTokens(user._id)

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id,
      description: `User ${user.email} promoted to WING_SECRETARY for wing ${wing.code}`,
      metadata: { wingId, previousRole: ROLES.MEMBER },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, wingId)
  }

  async demote(societyId, wingId, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const user = await userRepository.model.findOne({
      society: societyId,
      role: ROLES.WING_SECRETARY,
      managedWing: wingId,
      isDeleted: false,
    })

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No Wing Secretary assigned to this wing')
    }

    user.role = ROLES.MEMBER
    user.managedWing = null
    await user.save()

    await tokenService.revokeAllUserTokens(user._id)

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'User',
      entityId: user._id,
      description: `User ${user.email} demoted from WING_SECRETARY for wing ${wing.code}`,
      metadata: { wingId, newRole: ROLES.MEMBER },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return {
      wing: {
        id: wing._id.toString(),
        name: wing.name,
        code: wing.code,
      },
      secretary: null,
      demotedUser: sanitizeSecretaryUser(user),
    }
  }
}

export default new WingSecretaryService()
