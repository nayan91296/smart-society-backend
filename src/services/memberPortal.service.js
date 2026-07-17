import societyRepository from '../repositories/society.repository.js'
import memberRepository from '../repositories/member.repository.js'
import visitorRepository from '../repositories/visitor.repository.js'
import complaintRepository from '../repositories/complaint.repository.js'
import invoiceRepository from '../repositories/invoice.repository.js'
import noticeRepository from '../repositories/notice.repository.js'
import eventRepository from '../repositories/event.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  generateTicketNumber,
  sanitizeComplaint,
  sanitizeEvent,
  sanitizeInvoice,
  sanitizeNotice,
  sanitizeVisitor,
} from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  EVENT_STATUS,
  HTTP_STATUS,
  INVOICE_STATUS,
  NOTICE_AUDIENCE,
  NOTICE_STATUS,
  VISITOR_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

class MemberPortalService {
  async getDashboard(member) {
    const societyId = member.society
    const flatId = member.flat
    const memberId = member.id
    const now = new Date()

    const society = await societyRepository.findActiveById(societyId)
    const flat = await flatRepository.findInSociety(flatId, societyId)
    const wingId = flat?.wing?._id || flat?.wing
    const floorId = flat?.floor?._id || flat?.floor

    const pendingInvoiceStatuses = [
      INVOICE_STATUS.ISSUED,
      INVOICE_STATUS.PARTIALLY_PAID,
      INVOICE_STATUS.OVERDUE,
    ]

    const noticeVisibility = {
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
            { audience: NOTICE_AUDIENCE.FLAT, flat: flatId },
          ],
        },
      ],
    }

    const [
      coResidents,
      openComplaints,
      upcomingVisitors,
      pendingInvoices,
      publishedNotices,
      upcomingEvents,
      recentComplaints,
      recentVisitors,
      recentInvoices,
      recentNotices,
      recentEvents,
      pendingInvoiceDocs,
    ] = await Promise.all([
      memberRepository.findByFlat(flatId, { societyId, activeOnly: true }),
      complaintRepository.count({
        society: societyId,
        raisedByMember: memberId,
        isDeleted: false,
        status: { $in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_PROGRESS] },
      }),
      visitorRepository.count({
        society: societyId,
        flat: flatId,
        isDeleted: false,
        status: VISITOR_STATUS.EXPECTED,
      }),
      invoiceRepository.count({
        society: societyId,
        flat: flatId,
        isDeleted: false,
        status: { $in: pendingInvoiceStatuses },
      }),
      noticeRepository.count({
        society: societyId,
        isDeleted: false,
        ...noticeVisibility,
      }),
      eventRepository.count({
        society: societyId,
        isDeleted: false,
        $or: [
          { status: EVENT_STATUS.PUBLISHED, startAt: { $gte: now } },
          {
            status: EVENT_STATUS.ONGOING,
            $or: [{ endAt: { $gte: now } }, { endAt: null }],
          },
        ],
      }),
      complaintRepository.search({
        societyId,
        filter: { raisedByMember: memberId },
        page: 1,
        limit: 3,
      }),
      visitorRepository.search({
        societyId,
        filter: { flat: flatId },
        page: 1,
        limit: 3,
      }),
      invoiceRepository.search({
        societyId,
        filter: { flat: flatId },
        page: 1,
        limit: 3,
      }),
      noticeRepository.search({
        societyId,
        filter: noticeVisibility,
        page: 1,
        limit: 3,
        sort: { isPinned: -1, publishAt: -1 },
      }),
      eventRepository.search({
        societyId,
        filter: {
          status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING] },
        },
        page: 1,
        limit: 3,
        sort: { startAt: 1 },
      }),
      invoiceRepository.find({
        society: societyId,
        flat: flatId,
        isDeleted: false,
        status: { $in: pendingInvoiceStatuses },
      }),
    ])

    const balanceDue = pendingInvoiceDocs.reduce((sum, inv) => {
      return sum + Math.max(0, (inv.totalAmount || 0) - (inv.amountPaid || 0))
    }, 0)

    const flatDoc = flat?.toJSON ? flat.toJSON() : flat

    return {
      society: society
        ? {
            id: society._id.toString(),
            name: society.name,
            code: society.code,
          }
        : null,
      flat: flatDoc
        ? {
            id: flatDoc._id?.toString?.() || flatDoc.id,
            flatNumber: flatDoc.flatNumber,
            status: flatDoc.status,
            type: flatDoc.type,
            wing: flatDoc.wing,
            floor: flatDoc.floor,
          }
        : null,
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        ownershipType: member.ownershipType,
        isPrimary: member.isPrimary,
      },
      coResidents: coResidents
        .filter((m) => m._id.toString() !== memberId)
        .map((m) => ({
          id: m._id.toString(),
          firstName: m.firstName,
          lastName: m.lastName,
          phone: m.phone,
          ownershipType: m.ownershipType,
          isPrimary: m.isPrimary,
        })),
      stats: {
        openComplaints,
        upcomingVisitors,
        pendingInvoices,
        balanceDue,
        publishedNotices,
        upcomingEvents,
      },
      recentComplaints: recentComplaints.data.map(sanitizeComplaint),
      recentVisitors: recentVisitors.data.map(sanitizeVisitor),
      recentInvoices: recentInvoices.data.map(sanitizeInvoice),
      recentNotices: recentNotices.data.map(sanitizeNotice),
      recentEvents: recentEvents.data.map(sanitizeEvent),
    }
  }

  async listVisitors(member, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = { flat: member.flat }

    if (query.status) filter.status = query.status

    const result = await visitorRepository.search({
      societyId: member.society,
      filter,
      page,
      limit,
    })

    return {
      visitors: result.data.map(sanitizeVisitor),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async createVisitor(member, payload, actor, meta = {}) {
    const visitor = await visitorRepository.create({
      society: member.society,
      flat: member.flat,
      hostMember: member.id,
      name: payload.name,
      phone: payload.phone,
      purpose: payload.purpose,
      vehicleNumber: payload.vehicleNumber,
      expectedAt: payload.expectedAt,
      notes: payload.notes,
      status: VISITOR_STATUS.EXPECTED,
      createdBy: actor.id,
    })

    await activityLogRepository.log({
      society: member.society,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} expected for flat`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    const populated = await visitorRepository.findInSociety(visitor._id, member.society)
    return sanitizeVisitor(populated)
  }

  async cancelVisitor(member, id, actor, meta = {}) {
    const visitor = await visitorRepository.model.findOne({
      _id: id,
      society: member.society,
      flat: member.flat,
      hostMember: member.id,
      isDeleted: false,
    })

    if (!visitor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Visitor not found')
    }

    if (visitor.status !== VISITOR_STATUS.EXPECTED) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Only EXPECTED visitors can be cancelled',
      )
    }

    visitor.status = VISITOR_STATUS.CANCELLED
    await visitor.save()

    await activityLogRepository.log({
      society: member.society,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} cancelled by member`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    const populated = await visitorRepository.findInSociety(visitor._id, member.society)
    return sanitizeVisitor(populated)
  }

  async listComplaints(member, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = { raisedByMember: member.id }

    if (query.status) filter.status = query.status
    if (query.priority) filter.priority = query.priority

    const result = await complaintRepository.search({
      societyId: member.society,
      filter,
      page,
      limit,
    })

    return {
      complaints: result.data.map(sanitizeComplaint),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getComplaint(member, id) {
    const complaint = await complaintRepository.model
      .findOne({
        _id: id,
        society: member.society,
        raisedByMember: member.id,
        isDeleted: false,
      })
      .populate({
        path: 'flat',
        select: 'flatNumber wing floor',
        populate: { path: 'wing', select: 'name code' },
      })

    if (!complaint) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Complaint not found')
    }

    return sanitizeComplaint(complaint)
  }

  async createComplaint(member, payload, actor, meta = {}) {
    const complaint = await complaintRepository.create({
      society: member.society,
      flat: member.flat,
      raisedByUser: actor.id,
      raisedByMember: member.id,
      ticketNumber: generateTicketNumber(),
      category: payload.category,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || COMPLAINT_PRIORITY.MEDIUM,
      status: COMPLAINT_STATUS.OPEN,
    })

    await activityLogRepository.log({
      society: member.society,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Complaint',
      entityId: complaint._id,
      description: `Complaint ${complaint.ticketNumber} raised`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getComplaint(member, complaint._id)
  }
}

export default new MemberPortalService()
