import memberRepository from '../repositories/member.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import userRepository from '../repositories/user.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  FLAT_STATUS,
  HTTP_STATUS,
  MESSAGES,
  ROLES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const sanitizeMember = (member) => {
  const doc = member.toJSON ? member.toJSON() : member

  let flat = doc.flat
  if (flat && typeof flat === 'object' && (flat.flatNumber || flat._id)) {
    flat = {
      id: flat._id?.toString?.() || flat.id,
      flatNumber: flat.flatNumber,
      status: flat.status,
      type: flat.type,
      wing: flat.wing
        ? {
            id: flat.wing._id?.toString?.() || flat.wing.id,
            name: flat.wing.name,
            code: flat.wing.code,
          }
        : flat.wing,
      floor: flat.floor
        ? {
            id: flat.floor._id?.toString?.() || flat.floor.id,
            floorNumber: flat.floor.floorNumber,
            name: flat.floor.name,
          }
        : flat.floor,
    }
  }

  let user = doc.user
  if (user && typeof user === 'object' && (user.email || user._id)) {
    user = {
      id: user._id?.toString?.() || user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      isActive: user.isActive,
    }
  }

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    flat,
    user,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email ?? null,
    phone: doc.phone,
    ownershipType: doc.ownershipType,
    relation: doc.relation,
    isPrimary: doc.isPrimary,
    moveInDate: doc.moveInDate,
    moveOutDate: doc.moveOutDate,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

class MemberService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.flatId) filter.flat = query.flatId
    if (query.ownershipType) filter.ownershipType = query.ownershipType
    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === true || query.isActive === 'true'
    }

    if (query.wingId) {
      const flats = await flatRepository.find({
        society: societyId,
        wing: query.wingId,
        isDeleted: false,
      })
      filter.flat = { $in: flats.map((f) => f._id) }
      if (query.flatId) {
        const match = flats.some((f) => f._id.toString() === query.flatId)
        filter.flat = match ? query.flatId : { $in: [] }
      }
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
      ]
    }

    const result = await memberRepository.search({ societyId, filter, page, limit })

    return {
      members: result.data.map(sanitizeMember),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const member = await memberRepository.findInSociety(id, societyId)
    if (!member) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
    }
    return sanitizeMember(member)
  }

  async #resolveLoginUser(societyId, payload) {
    if (!payload.createLogin) return null

    if (!payload.email) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is required when createLogin is true')
    }
    if (!payload.password || payload.password.length < 8) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Password (min 8 characters) is required when createLogin is true',
      )
    }

    const existing = await userRepository.findByEmail(payload.email)
    if (!existing || existing.isDeleted) {
      return userRepository.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        role: ROLES.MEMBER,
        society: societyId,
      })
    }

    const existingSociety = existing.society?.toString?.() || existing.society
    if (existing.role === ROLES.MEMBER && existingSociety === societyId.toString()) {
      return existing
    }

    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Email is already used by another account or society',
    )
  }

  async #maybeMarkFlatOccupied(flat) {
    if (flat.status === FLAT_STATUS.VACANT) {
      flat.status = FLAT_STATUS.OCCUPIED
      await flat.save()
    }
  }

  async create(societyId, payload, actor, meta = {}) {
    const flat = await flatRepository.findInSociety(payload.flatId, societyId)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    const user = await this.#resolveLoginUser(societyId, payload)

    if (payload.isPrimary) {
      await memberRepository.unsetPrimaryOnFlat(payload.flatId)
    }

    const member = await memberRepository.create({
      society: societyId,
      flat: payload.flatId,
      user: user?._id || null,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      ownershipType: payload.ownershipType,
      relation: payload.relation,
      isPrimary: Boolean(payload.isPrimary),
      moveInDate: payload.moveInDate,
      moveOutDate: payload.moveOutDate,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdBy: actor.id,
    })

    if (member.isActive) {
      await this.#maybeMarkFlatOccupied(flat)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Member',
      entityId: member._id,
      description: `Member ${member.firstName} ${member.lastName} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, member._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const member = await memberRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!member) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
    }

    if (payload.flatId !== undefined) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
      }
      member.flat = payload.flatId
    }

    if (payload.isPrimary === true) {
      await memberRepository.unsetPrimaryOnFlat(member.flat, member._id)
      member.isPrimary = true
    } else if (payload.isPrimary === false) {
      member.isPrimary = false
    }

    ;[
      'firstName',
      'lastName',
      'email',
      'phone',
      'ownershipType',
      'relation',
      'moveInDate',
      'moveOutDate',
      'isActive',
    ].forEach((field) => {
      if (payload[field] !== undefined) member[field] = payload[field]
    })

    await member.save()

    if (member.isActive) {
      const flat = await flatRepository.model.findOne({
        _id: member.flat,
        society: societyId,
        isDeleted: false,
      })
      if (flat) await this.#maybeMarkFlatOccupied(flat)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Member',
      entityId: member._id,
      description: `Member ${member.firstName} ${member.lastName} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const member = await memberRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!member) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
    }

    member.isDeleted = true
    member.deletedAt = new Date()
    member.isActive = false
    member.isPrimary = false
    await member.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Member',
      entityId: member._id,
      description: `Member ${member.firstName} ${member.lastName} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async toggleActive(societyId, id, actor, meta = {}) {
    const member = await memberRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!member) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
    }

    member.isActive = !member.isActive
    if (!member.isActive) member.isPrimary = false
    await member.save()

    if (member.isActive) {
      const flat = await flatRepository.model.findOne({
        _id: member.flat,
        society: societyId,
        isDeleted: false,
      })
      if (flat) await this.#maybeMarkFlatOccupied(flat)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Member',
      entityId: member._id,
      description: `Member ${member.firstName} ${member.lastName} set ${member.isActive ? 'active' : 'inactive'}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }
}

export { sanitizeMember }
export default new MemberService()
