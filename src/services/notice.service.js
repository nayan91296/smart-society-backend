import noticeRepository from '../repositories/notice.repository.js'
import wingRepository from '../repositories/wing.repository.js'
import floorRepository from '../repositories/floor.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import Event from '../models/event.model.js'
import Document from '../models/document.model.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { sanitizeNotice } from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  NOTICE_AUDIENCE,
  NOTICE_PRIORITY,
  NOTICE_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class NoticeService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.priority) filter.priority = query.priority
    if (query.audience) filter.audience = query.audience

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ title: regex }, { content: regex }]
    }

    const result = await noticeRepository.search({
      societyId,
      filter,
      page,
      limit,
      sort: { isPinned: -1, createdAt: -1 },
    })

    return {
      notices: result.data.map(sanitizeNotice),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const notice = await noticeRepository.findInSociety(id, societyId)
    if (!notice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found')
    }
    return sanitizeNotice(notice)
  }

  async #validateAudience(societyId, audience, payload) {
    if (audience === NOTICE_AUDIENCE.WING) {
      if (!payload.wingId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'wingId is required for WING audience')
      }
      const wing = await wingRepository.findInSociety(payload.wingId, societyId)
      if (!wing) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found in this society')
    }

    if (audience === NOTICE_AUDIENCE.FLOOR) {
      if (!payload.floorId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'floorId is required for FLOOR audience')
      }
      const floor = await floorRepository.findInSociety(payload.floorId, societyId)
      if (!floor) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found in this society')
    }

    if (audience === NOTICE_AUDIENCE.FLAT) {
      if (!payload.flatId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'flatId is required for FLAT audience')
      }
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }
  }

  async #validateOptionalRefs(societyId, payload) {
    if (payload.eventId) {
      const event = await Event.findOne({
        _id: payload.eventId,
        society: societyId,
        isDeleted: false,
      })
      if (!event) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    if (payload.documentIds?.length) {
      const count = await Document.countDocuments({
        _id: { $in: payload.documentIds },
        society: societyId,
        isDeleted: false,
      })
      if (count !== payload.documentIds.length) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'One or more documents are invalid')
      }
    }
  }

  #audienceFields(audience, payload) {
    return {
      wing: audience === NOTICE_AUDIENCE.WING ? payload.wingId : null,
      floor: audience === NOTICE_AUDIENCE.FLOOR ? payload.floorId : null,
      flat: audience === NOTICE_AUDIENCE.FLAT ? payload.flatId : null,
    }
  }

  async create(societyId, payload, actor, meta = {}) {
    const audience = payload.audience || NOTICE_AUDIENCE.SOCIETY
    await this.#validateAudience(societyId, audience, payload)
    await this.#validateOptionalRefs(societyId, payload)

    const status = payload.status || NOTICE_STATUS.DRAFT
    let publishAt = payload.publishAt || undefined

    if (status === NOTICE_STATUS.PUBLISHED && !publishAt) {
      publishAt = new Date()
    }

    const notice = await noticeRepository.create({
      society: societyId,
      title: payload.title,
      content: payload.content,
      priority: payload.priority || NOTICE_PRIORITY.NORMAL,
      status,
      audience,
      ...this.#audienceFields(audience, payload),
      publishAt,
      expiresAt: payload.expiresAt || undefined,
      isPinned: payload.isPinned ?? false,
      createdBy: actor.id,
      event: payload.eventId || null,
      documents: payload.documentIds || [],
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Notice',
      entityId: notice._id,
      description: `Notice "${notice.title}" created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, notice._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const notice = await noticeRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!notice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found')
    }

    const audience = payload.audience || notice.audience
    if (payload.audience || payload.wingId || payload.floorId || payload.flatId) {
      await this.#validateAudience(societyId, audience, {
        wingId: payload.wingId ?? notice.wing?.toString?.(),
        floorId: payload.floorId ?? notice.floor?.toString?.(),
        flatId: payload.flatId ?? notice.flat?.toString?.(),
      })
      notice.audience = audience
      Object.assign(notice, this.#audienceFields(audience, {
        wingId: payload.wingId ?? notice.wing?.toString?.(),
        floorId: payload.floorId ?? notice.floor?.toString?.(),
        flatId: payload.flatId ?? notice.flat?.toString?.(),
      }))
    }

    await this.#validateOptionalRefs(societyId, payload)

    ;['title', 'content', 'priority', 'isPinned'].forEach((field) => {
      if (payload[field] !== undefined) notice[field] = payload[field]
    })

    if (payload.publishAt !== undefined) notice.publishAt = payload.publishAt || undefined
    if (payload.expiresAt !== undefined) notice.expiresAt = payload.expiresAt || undefined
    if (payload.eventId !== undefined) notice.event = payload.eventId || null
    if (payload.documentIds !== undefined) notice.documents = payload.documentIds

    if (payload.status !== undefined) {
      this.#applyStatus(notice, payload.status)
    }

    await notice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Notice',
      entityId: notice._id,
      description: `Notice "${notice.title}" updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  #applyStatus(notice, status) {
    if (!Object.values(NOTICE_STATUS).includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid notice status')
    }

    notice.status = status

    if (status === NOTICE_STATUS.PUBLISHED && !notice.publishAt) {
      notice.publishAt = new Date()
    }
  }

  async updateStatus(societyId, id, payload, actor, meta = {}) {
    const notice = await noticeRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!notice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found')
    }

    this.#applyStatus(notice, payload.status)
    await notice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Notice',
      entityId: notice._id,
      description: `Notice "${notice.title}" status changed to ${notice.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const notice = await noticeRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!notice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found')
    }

    notice.isDeleted = true
    notice.deletedAt = new Date()
    await notice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Notice',
      entityId: notice._id,
      description: `Notice "${notice.title}" deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  #memberVisibilityFilter(member, flat) {
    const now = new Date()
    const wingId = flat?.wing?._id || flat?.wing
    const floorId = flat?.floor?._id || flat?.floor

    return {
      status: NOTICE_STATUS.PUBLISHED,
      $and: [
        {
          $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }],
        },
        {
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        {
          $or: [
            { audience: NOTICE_AUDIENCE.SOCIETY },
            { audience: NOTICE_AUDIENCE.WING, wing: wingId },
            { audience: NOTICE_AUDIENCE.FLOOR, floor: floorId },
            { audience: NOTICE_AUDIENCE.FLAT, flat: member.flat },
          ],
        },
      ],
    }
  }

  async listForMember(member, query = {}) {
    const flat = await flatRepository.findInSociety(member.flat, member.society)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member flat not found')
    }

    const { page, limit } = getPagination(query.page, query.limit)
    const filter = this.#memberVisibilityFilter(member, flat)

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$and.push({ $or: [{ title: regex }, { content: regex }] })
    }

    const result = await noticeRepository.search({
      societyId: member.society,
      filter,
      page,
      limit,
      sort: { isPinned: -1, publishAt: -1, createdAt: -1 },
    })

    return {
      notices: result.data.map(sanitizeNotice),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getForMember(member, id) {
    const flat = await flatRepository.findInSociety(member.flat, member.society)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member flat not found')
    }

    const notice = await noticeRepository.model
      .findOne({
        _id: id,
        society: member.society,
        isDeleted: false,
        ...this.#memberVisibilityFilter(member, flat),
      })
      .populate('wing', 'name code')
      .populate('floor', 'floorNumber name')
      .populate({
        path: 'flat',
        select: 'flatNumber wing floor',
        populate: [
          { path: 'wing', select: 'name code' },
          { path: 'floor', select: 'floorNumber name' },
        ],
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('event', 'title startAt endAt status')
      .populate('documents', 'title fileName fileUrl category')

    if (!notice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notice not found')
    }

    return sanitizeNotice(notice)
  }
}

export default new NoticeService()
