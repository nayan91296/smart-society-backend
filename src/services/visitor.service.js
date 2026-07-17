import visitorRepository from '../repositories/visitor.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import memberRepository from '../repositories/member.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import notificationDispatchService from './notifications/dispatch.service.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
  VISITOR_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import { sanitizeVisitor } from '../helpers/entity.helper.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const VALID_TRANSITIONS = {
  [VISITOR_STATUS.EXPECTED]: [
    VISITOR_STATUS.CHECKED_IN,
    VISITOR_STATUS.DENIED,
    VISITOR_STATUS.CANCELLED,
  ],
  [VISITOR_STATUS.CHECKED_IN]: [VISITOR_STATUS.CHECKED_OUT],
  [VISITOR_STATUS.CHECKED_OUT]: [],
  [VISITOR_STATUS.DENIED]: [],
  [VISITOR_STATUS.CANCELLED]: [],
}

class VisitorService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.flatId) filter.flat = query.flatId
    if (query.hostMemberId) filter.hostMember = query.hostMemberId
    if (query.status) filter.status = query.status

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
      filter.$or = [{ name: regex }, { phone: regex }, { vehicleNumber: regex }]
    }

    const result = await visitorRepository.search({ societyId, filter, page, limit })

    return {
      visitors: result.data.map(sanitizeVisitor),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const visitor = await visitorRepository.findInSociety(id, societyId)
    if (!visitor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Visitor not found')
    }
    return sanitizeVisitor(visitor)
  }

  async create(societyId, payload, actor, meta = {}) {
    const flat = await flatRepository.findInSociety(payload.flatId, societyId)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    const hostMemberId = payload.hostMemberId || null
    if (hostMemberId) {
      const host = await memberRepository.findInSociety(hostMemberId, societyId)
      if (!host) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Host member not found')
      }
      const hostFlatId = host.flat?._id?.toString?.() || host.flat?.toString?.() || host.flat
      if (hostFlatId !== payload.flatId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Host member does not belong to the selected flat')
      }
    }

    const visitor = await visitorRepository.create({
      society: societyId,
      flat: payload.flatId,
      hostMember: hostMemberId,
      name: payload.name,
      phone: payload.phone,
      purpose: payload.purpose,
      vehicleNumber: payload.vehicleNumber,
      expectedAt: payload.expectedAt,
      notes: payload.notes,
      status: payload.status || VISITOR_STATUS.EXPECTED,
      createdBy: actor.id,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, visitor._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const visitor = await visitorRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!visitor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Visitor not found')
    }

    if (payload.flatId !== undefined) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
      visitor.flat = payload.flatId
    }

    if (payload.hostMemberId !== undefined) {
      if (payload.hostMemberId) {
        const host = await memberRepository.findInSociety(payload.hostMemberId, societyId)
        if (!host) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Host member not found')
      }
      visitor.hostMember = payload.hostMemberId || null
    }

    ;['name', 'phone', 'purpose', 'vehicleNumber', 'expectedAt', 'notes'].forEach((field) => {
      if (payload[field] !== undefined) visitor[field] = payload[field]
    })

    await visitor.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async updateStatus(societyId, id, status, actor, meta = {}) {
    const visitor = await visitorRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!visitor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Visitor not found')
    }

    const allowed = VALID_TRANSITIONS[visitor.status] || []
    if (!allowed.includes(status)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid status transition from ${visitor.status} to ${status}`,
      )
    }

    visitor.status = status

    if (status === VISITOR_STATUS.CHECKED_IN) {
      visitor.entryAt = new Date()
      visitor.approvedBy = actor.id
    }
    if (status === VISITOR_STATUS.CHECKED_OUT) {
      visitor.exitAt = new Date()
    }

    await visitor.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} status changed to ${status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    if (status === VISITOR_STATUS.CHECKED_IN && visitor.hostMember) {
      try {
        const member = await memberRepository.findInSociety(visitor.hostMember.toString(), societyId)
        const userId = member?.user?.toString?.() || member?.user
        if (userId) {
          await notificationDispatchService.dispatchToUser({
            userId,
            societyId,
            title: 'Visitor checked in',
            message: `${visitor.name} has checked in`,
            type: NOTIFICATION_TYPE.VISITOR,
            data: { visitorId: visitor._id.toString(), name: visitor.name },
            entityType: 'Visitor',
            entityId: visitor._id,
            channels: [NOTIFICATION_CHANNEL.IN_APP],
            createdBy: actor.id,
          })
        }
      } catch {
        // Non-blocking
      }
    }

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const visitor = await visitorRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!visitor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Visitor not found')
    }

    visitor.isDeleted = true
    visitor.deletedAt = new Date()
    await visitor.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }
}

export default new VisitorService()
