import complaintRepository from '../repositories/complaint.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import memberRepository from '../repositories/member.repository.js'
import userRepository from '../repositories/user.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import notificationDispatchService from './notifications/dispatch.service.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { applyWingFlatFilter, assertFlatInWing, getRefId } from '../helpers/wingScope.helper.js'
import {
  ACTIVITY_ACTION,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
  ROLES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import { generateTicketNumber, sanitizeComplaint } from '../helpers/entity.helper.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class ComplaintService {
  async #assertComplaintInWing(complaint, societyId, wingId) {
    if (!wingId) return
    await assertFlatInWing(getRefId(complaint.flat), societyId, wingId)
  }

  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.priority) filter.priority = query.priority
    if (query.raisedByMemberId) filter.raisedByMember = query.raisedByMemberId
    if (query.category) filter.category = new RegExp(escapeRegex(query.category), 'i')

    await applyWingFlatFilter(filter, societyId, query.wingId || null, query.flatId || null)

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ title: regex }, { description: regex }, { ticketNumber: regex }, { category: regex }]
    }

    const result = await complaintRepository.search({ societyId, filter, page, limit })

    return {
      complaints: result.data.map(sanitizeComplaint),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id, scope = {}) {
    const complaint = await complaintRepository.findInSociety(id, societyId)
    if (!complaint) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Complaint not found')
    }
    await this.#assertComplaintInWing(complaint, societyId, scope.wingId)
    return sanitizeComplaint(complaint)
  }

  async create(societyId, payload, actor, meta = {}, scope = {}) {
    let flatId = payload.flatId || null
    const raisedByMemberId = payload.raisedByMemberId || null

    if (flatId) {
      const flat = await flatRepository.findInSociety(flatId, societyId)
      if (!flat) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
      }
    }

    if (raisedByMemberId) {
      const member = await memberRepository.findInSociety(raisedByMemberId, societyId)
      if (!member) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
      }
      if (!flatId) {
        flatId = getRefId(member.flat)
      }
    }

    if (scope.wingId) {
      await assertFlatInWing(flatId, societyId, scope.wingId)
    }

    const complaint = await complaintRepository.create({
      society: societyId,
      flat: flatId,
      raisedByUser: actor.id,
      raisedByMember: raisedByMemberId,
      ticketNumber: generateTicketNumber(),
      category: payload.category,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || COMPLAINT_PRIORITY.MEDIUM,
      status: COMPLAINT_STATUS.OPEN,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Complaint',
      entityId: complaint._id,
      description: `Complaint ${complaint.ticketNumber} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    try {
      const flat = flatId ? await flatRepository.findInSociety(flatId, societyId) : null
      const flatWingId = flat ? getRefId(flat.wing) : null

      const recipients = await userRepository.model.find({
        society: societyId,
        isActive: true,
        isDeleted: false,
        $or: [
          { role: ROLES.SOCIETY_ADMIN },
          ...(flatWingId
            ? [{ role: ROLES.WING_SECRETARY, managedWing: flatWingId }]
            : []),
        ],
      })

      await notificationDispatchService.dispatchToUsers(
        recipients.map((u) => u._id.toString()),
        {
          societyId,
          title: 'New complaint',
          message: `${complaint.ticketNumber}: ${complaint.title}`,
          type: NOTIFICATION_TYPE.COMPLAINT,
          data: { complaintId: complaint._id.toString(), ticketNumber: complaint.ticketNumber },
          entityType: 'Complaint',
          entityId: complaint._id,
          channels: [NOTIFICATION_CHANNEL.IN_APP],
          createdBy: actor.id,
        },
      )
    } catch {
      // Non-blocking
    }

    return this.get(societyId, complaint._id, scope)
  }

  async update(societyId, id, payload, actor, meta = {}, scope = {}) {
    const complaint = await complaintRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!complaint) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Complaint not found')
    }

    await this.#assertComplaintInWing(complaint, societyId, scope.wingId)

    ;['category', 'title', 'description', 'priority', 'resolutionNotes'].forEach((field) => {
      if (payload[field] !== undefined) complaint[field] = payload[field]
    })

    if (payload.status !== undefined && payload.status !== complaint.status) {
      this.#applyStatus(complaint, payload.status)
    }

    await complaint.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Complaint',
      entityId: complaint._id,
      description: `Complaint ${complaint.ticketNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id, scope)
  }

  #applyStatus(complaint, status) {
    if (!Object.values(COMPLAINT_STATUS).includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid complaint status')
    }

    complaint.status = status

    if (status === COMPLAINT_STATUS.RESOLVED && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date()
    }
    if (status === COMPLAINT_STATUS.CLOSED && !complaint.closedAt) {
      complaint.closedAt = new Date()
      if (!complaint.resolvedAt) complaint.resolvedAt = new Date()
    }
  }

  async updateStatus(societyId, id, payload, actor, meta = {}, scope = {}) {
    const complaint = await complaintRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!complaint) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Complaint not found')
    }

    await this.#assertComplaintInWing(complaint, societyId, scope.wingId)

    this.#applyStatus(complaint, payload.status)

    if (payload.priority !== undefined) complaint.priority = payload.priority
    if (payload.resolutionNotes !== undefined) complaint.resolutionNotes = payload.resolutionNotes

    await complaint.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Complaint',
      entityId: complaint._id,
      description: `Complaint ${complaint.ticketNumber} status changed to ${complaint.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id, scope)
  }

  async softDelete(societyId, id, actor, meta = {}, scope = {}) {
    const complaint = await complaintRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!complaint) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Complaint not found')
    }

    await this.#assertComplaintInWing(complaint, societyId, scope.wingId)

    complaint.isDeleted = true
    complaint.deletedAt = new Date()
    await complaint.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Complaint',
      entityId: complaint._id,
      description: `Complaint ${complaint.ticketNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }
}

export default new ComplaintService()
