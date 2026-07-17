import eventRepository from '../repositories/event.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { sanitizeEvent } from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  EVENT_STATUS,
  HTTP_STATUS,
  MESSAGES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const MEMBER_VISIBLE_STATUSES = [EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING]

class EventService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status

    if (query.from || query.to) {
      filter.startAt = {}
      if (query.from) filter.startAt.$gte = new Date(query.from)
      if (query.to) filter.startAt.$lte = new Date(query.to)
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ title: regex }, { description: regex }, { location: regex }]
    }

    const result = await eventRepository.search({ societyId, filter, page, limit })

    return {
      events: result.data.map(sanitizeEvent),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const event = await eventRepository.findInSociety(id, societyId)
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }
    return sanitizeEvent(event)
  }

  #validateDates(startAt, endAt) {
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid startAt or endAt')
    }
    if (end <= start) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'endAt must be after startAt')
    }
  }

  #validateCapacity(maxAttendees) {
    if (maxAttendees !== undefined && maxAttendees !== null && maxAttendees < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'maxAttendees must be >= 0')
    }
  }

  #applyStatus(event, status) {
    if (!Object.values(EVENT_STATUS).includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid event status')
    }

    const current = event.status
    const allowed = {
      [EVENT_STATUS.DRAFT]: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED],
      [EVENT_STATUS.PUBLISHED]: [
        EVENT_STATUS.ONGOING,
        EVENT_STATUS.COMPLETED,
        EVENT_STATUS.CANCELLED,
        EVENT_STATUS.DRAFT,
      ],
      [EVENT_STATUS.ONGOING]: [EVENT_STATUS.COMPLETED, EVENT_STATUS.CANCELLED],
      [EVENT_STATUS.COMPLETED]: [],
      [EVENT_STATUS.CANCELLED]: [EVENT_STATUS.DRAFT],
    }

    if (status !== current && !allowed[current]?.includes(status)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid event status transition from ${current} to ${status}`,
      )
    }

    event.status = status
  }

  async create(societyId, payload, actor, meta = {}) {
    this.#validateDates(payload.startAt, payload.endAt)
    this.#validateCapacity(payload.maxAttendees)

    const event = await eventRepository.create({
      society: societyId,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      startAt: payload.startAt,
      endAt: payload.endAt,
      status: payload.status || EVENT_STATUS.DRAFT,
      maxAttendees: payload.maxAttendees,
      coverImageUrl: payload.coverImageUrl,
      createdBy: actor.id,
      attendees: [],
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Event',
      entityId: event._id,
      description: `Event "${event.title}" created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, event._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const event = await eventRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    ;['title', 'description', 'location', 'coverImageUrl'].forEach((field) => {
      if (payload[field] !== undefined) event[field] = payload[field]
    })

    if (payload.startAt !== undefined) event.startAt = payload.startAt
    if (payload.endAt !== undefined) event.endAt = payload.endAt
    if (payload.startAt !== undefined || payload.endAt !== undefined) {
      this.#validateDates(event.startAt, event.endAt)
    }

    if (payload.maxAttendees !== undefined) {
      this.#validateCapacity(payload.maxAttendees)
      if (
        payload.maxAttendees !== null &&
        event.attendees.length > payload.maxAttendees
      ) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'maxAttendees cannot be less than current attendees',
        )
      }
      event.maxAttendees = payload.maxAttendees
    }

    if (payload.status !== undefined && payload.status !== event.status) {
      this.#applyStatus(event, payload.status)
    }

    await event.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Event',
      entityId: event._id,
      description: `Event "${event.title}" updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async updateStatus(societyId, id, payload, actor, meta = {}) {
    const event = await eventRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    this.#applyStatus(event, payload.status)
    await event.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Event',
      entityId: event._id,
      description: `Event "${event.title}" status changed to ${event.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const event = await eventRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    event.isDeleted = true
    event.deletedAt = new Date()
    await event.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Event',
      entityId: event._id,
      description: `Event "${event.title}" deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async listForMember(member, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {
      status: { $in: MEMBER_VISIBLE_STATUSES },
    }

    if (query.from || query.to) {
      filter.startAt = {}
      if (query.from) filter.startAt.$gte = new Date(query.from)
      if (query.to) filter.startAt.$lte = new Date(query.to)
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ title: regex }, { description: regex }, { location: regex }]
    }

    const result = await eventRepository.search({
      societyId: member.society,
      filter,
      page,
      limit,
    })

    return {
      events: result.data.map(sanitizeEvent),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getForMember(member, id) {
    const event = await eventRepository.model
      .findOne({
        _id: id,
        society: member.society,
        isDeleted: false,
        status: { $in: MEMBER_VISIBLE_STATUSES },
      })
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.member', 'firstName lastName phone')
      .populate('attendees.user', 'firstName lastName email')

    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    return sanitizeEvent(event)
  }

  async rsvp(member, id, actor, meta = {}) {
    const event = await eventRepository.model.findOne({
      _id: id,
      society: member.society,
      isDeleted: false,
    })
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    if (!MEMBER_VISIBLE_STATUSES.includes(event.status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot RSVP to this event')
    }

    if ([EVENT_STATUS.CANCELLED, EVENT_STATUS.COMPLETED].includes(event.status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot RSVP to cancelled or completed events')
    }

    const already = event.attendees.some(
      (a) => a.member?.toString() === member.id || a.user?.toString() === actor.id,
    )
    if (already) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Already registered for this event')
    }

    if (
      event.maxAttendees !== undefined &&
      event.maxAttendees !== null &&
      event.attendees.length >= event.maxAttendees
    ) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Event is at full capacity')
    }

    event.attendees.push({
      member: member.id,
      user: actor.id,
      registeredAt: new Date(),
    })
    await event.save()

    await activityLogRepository.log({
      society: member.society,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Event',
      entityId: event._id,
      description: `Member RSVP to event "${event.title}"`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getForMember(member, id)
  }

  async cancelRsvp(member, id, actor, meta = {}) {
    const event = await eventRepository.model.findOne({
      _id: id,
      society: member.society,
      isDeleted: false,
    })
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found')
    }

    const before = event.attendees.length
    event.attendees = event.attendees.filter(
      (a) => a.member?.toString() !== member.id && a.user?.toString() !== actor.id,
    )

    if (event.attendees.length === before) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'RSVP not found')
    }

    await event.save()

    await activityLogRepository.log({
      society: member.society,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Event',
      entityId: event._id,
      description: `Member cancelled RSVP for event "${event.title}"`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getForMember(member, id)
  }
}

export default new EventService()
