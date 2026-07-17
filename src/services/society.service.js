import societyRepository from '../repositories/society.repository.js'
import wingRepository from '../repositories/wing.repository.js'
import floorRepository from '../repositories/floor.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import memberRepository from '../repositories/member.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import paymentRepository from '../repositories/payment.repository.js'
import Member from '../models/member.model.js'
import Staff from '../models/staff.model.js'
import Guard from '../models/guard.model.js'
import Complaint from '../models/complaint.model.js'
import Maintenance from '../models/maintenance.model.js'
import Invoice from '../models/invoice.model.js'
import Event from '../models/event.model.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  COMPLAINT_STATUS,
  EVENT_STATUS,
  FLAT_STATUS,
  HTTP_STATUS,
  INVOICE_STATUS,
  MAINTENANCE_STATUS,
  MESSAGES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRefId = (ref) => {
  if (!ref) return null
  if (typeof ref === 'string') return ref
  return ref._id?.toString?.() || ref.id?.toString?.() || null
}

const sanitizeSociety = (society) => {
  const doc = society.toJSON ? society.toJSON() : society
  return {
    id: doc._id?.toString?.() || doc.id,
    name: doc.name,
    code: doc.code,
    registrationNumber: doc.registrationNumber,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    status: doc.status,
    settings: doc.settings,
    admin: doc.admin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const sanitizeWing = (wing) => {
  const doc = wing.toJSON ? wing.toJSON() : wing
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    name: doc.name,
    code: doc.code,
    description: doc.description,
    totalFloors: doc.totalFloors,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const sanitizeFloor = (floor) => {
  const doc = floor.toJSON ? floor.toJSON() : floor
  const wing =
    doc.wing && typeof doc.wing === 'object' && (doc.wing.name || doc.wing.code)
      ? {
          id: doc.wing._id?.toString?.() || doc.wing.id,
          name: doc.wing.name,
          code: doc.wing.code,
        }
      : doc.wing

  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    wing,
    floorNumber: doc.floorNumber,
    name: doc.name,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const sanitizeFlat = (flat) => {
  const doc = flat.toJSON ? flat.toJSON() : flat
  return {
    id: doc._id?.toString?.() || doc.id,
    society: doc.society,
    wing: doc.wing,
    floor: doc.floor,
    flatNumber: doc.flatNumber,
    type: doc.type,
    status: doc.status,
    areaSqFt: doc.areaSqFt,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

class SocietyService {
  async getProfile(societyId) {
    const society = await societyRepository.findActiveById(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }
    return sanitizeSociety(society)
  }

  async updateProfile(societyId, payload, actor, meta = {}) {
    const society = await societyRepository.findActiveById(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    if (payload.name !== undefined) society.name = payload.name
    if (payload.email !== undefined) society.email = payload.email
    if (payload.phone !== undefined) society.phone = payload.phone
    if (payload.registrationNumber !== undefined) {
      society.registrationNumber = payload.registrationNumber
    }
    if (payload.address !== undefined) {
      society.address = { ...(society.address?.toObject?.() || society.address || {}), ...payload.address }
    }
    if (payload.settings !== undefined) {
      society.settings = { ...(society.settings?.toObject?.() || society.settings || {}), ...payload.settings }
    }

    await society.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Society',
      entityId: society._id,
      description: 'Society profile updated',
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeSociety(society)
  }

  async getOverview(societyId) {
    const [wings, floors, flats, vacant, occupied, underMaintenance] = await Promise.all([
      wingRepository.count({ society: societyId, isDeleted: false }),
      floorRepository.count({ society: societyId, isDeleted: false }),
      flatRepository.count({ society: societyId, isDeleted: false }),
      flatRepository.count({ society: societyId, isDeleted: false, status: FLAT_STATUS.VACANT }),
      flatRepository.count({ society: societyId, isDeleted: false, status: FLAT_STATUS.OCCUPIED }),
      flatRepository.count({
        society: societyId,
        isDeleted: false,
        status: FLAT_STATUS.UNDER_MAINTENANCE,
      }),
    ])

    return {
      wings,
      floors,
      flats,
      vacantFlats: vacant,
      occupiedFlats: occupied,
      underMaintenanceFlats: underMaintenance,
    }
  }

  async getDashboard(societyId) {
    const society = await societyRepository.findActiveById(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    const now = new Date()

    const [
      wings,
      floors,
      flats,
      vacant,
      occupied,
      underMaintenance,
      members,
      staff,
      guards,
      openComplaints,
      openMaintenance,
      pendingInvoices,
      successfulPaymentsTotal,
      upcomingEvents,
      recentActivity,
      recentFlats,
      vacantFlatsList,
      wingsList,
    ] = await Promise.all([
      wingRepository.count({ society: societyId, isDeleted: false }),
      floorRepository.count({ society: societyId, isDeleted: false }),
      flatRepository.count({ society: societyId, isDeleted: false }),
      flatRepository.count({ society: societyId, isDeleted: false, status: FLAT_STATUS.VACANT }),
      flatRepository.count({ society: societyId, isDeleted: false, status: FLAT_STATUS.OCCUPIED }),
      flatRepository.count({
        society: societyId,
        isDeleted: false,
        status: FLAT_STATUS.UNDER_MAINTENANCE,
      }),
      Member.countDocuments({ society: societyId, isDeleted: false, isActive: true }),
      Staff.countDocuments({ society: societyId, isDeleted: false, isActive: true }),
      Guard.countDocuments({ society: societyId, isDeleted: false, isActive: true }),
      Complaint.countDocuments({
        society: societyId,
        isDeleted: false,
        status: { $in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_PROGRESS] },
      }),
      Maintenance.countDocuments({
        society: societyId,
        isDeleted: false,
        status: {
          $in: [
            MAINTENANCE_STATUS.OPEN,
            MAINTENANCE_STATUS.SCHEDULED,
            MAINTENANCE_STATUS.IN_PROGRESS,
          ],
        },
      }),
      Invoice.countDocuments({
        society: societyId,
        isDeleted: false,
        status: { $in: [INVOICE_STATUS.ISSUED, INVOICE_STATUS.PARTIALLY_PAID, INVOICE_STATUS.OVERDUE] },
      }),
      paymentRepository.sumSuccessfulAmount({ society: societyId }),
      Event.countDocuments({
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
      activityLogRepository.search({
        filter: { society: societyId },
        page: 1,
        limit: 8,
      }),
      flatRepository.model
        .find({ society: societyId, isDeleted: false })
        .populate('wing', 'name code')
        .populate('floor', 'floorNumber name')
        .sort({ updatedAt: -1 })
        .limit(5),
      flatRepository.model
        .find({ society: societyId, isDeleted: false, status: FLAT_STATUS.VACANT })
        .populate('wing', 'name code')
        .populate('floor', 'floorNumber name')
        .sort({ flatNumber: 1 })
        .limit(5),
      wingRepository.findBySociety(societyId),
    ])

    const occupancyRate = flats > 0 ? Math.round((occupied / flats) * 100) : 0

    const wingsSummary = await Promise.all(
      wingsList.map(async (wing) => {
        const [floorCount, flatCount] = await Promise.all([
          floorRepository.count({ society: societyId, wing: wing._id, isDeleted: false }),
          flatRepository.count({ society: societyId, wing: wing._id, isDeleted: false }),
        ])

        return {
          id: wing._id.toString(),
          name: wing.name,
          code: wing.code,
          isActive: wing.isActive,
          floors: floorCount,
          flats: flatCount,
        }
      }),
    )

    const sanitizeFlatRow = (flat) => {
      const doc = flat.toJSON ? flat.toJSON() : flat
      return {
        id: doc._id?.toString?.() || doc.id,
        flatNumber: doc.flatNumber,
        type: doc.type,
        status: doc.status,
        wing: doc.wing,
        floor: doc.floor,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt,
      }
    }

    return {
      society: sanitizeSociety(society),
      stats: {
        wings,
        floors,
        flats,
        vacantFlats: vacant,
        occupiedFlats: occupied,
        underMaintenanceFlats: underMaintenance,
        occupancyRate,
        members,
        staff,
        guards,
        openComplaints,
        openMaintenance,
        pendingInvoices,
        successfulPaymentsTotal,
        upcomingEvents,
      },
      recentActivity: recentActivity.data,
      recentFlats: recentFlats.map(sanitizeFlatRow),
      vacantFlats: vacantFlatsList.map(sanitizeFlatRow),
      wingsSummary,
      alerts: {
        highVacancy: flats > 0 && vacant / flats >= 0.4,
        hasOpenComplaints: openComplaints > 0,
        hasOpenMaintenance: openMaintenance > 0,
        hasPendingInvoices: pendingInvoices > 0,
      },
    }
  }

  async listWings(societyId, query = {}) {
    const isActive =
      query.isActive === undefined || query.isActive === ''
        ? undefined
        : query.isActive === true || query.isActive === 'true'

    const wings = await wingRepository.searchBySociety(societyId, {
      search: query.search,
      isActive,
    })

    return Promise.all(
      wings.map(async (wing) => {
        const [floorCount, flatCount] = await Promise.all([
          floorRepository.count({ society: societyId, wing: wing._id, isDeleted: false }),
          flatRepository.count({ society: societyId, wing: wing._id, isDeleted: false }),
        ])

        return {
          ...sanitizeWing(wing),
          floorCount,
          flatCount,
        }
      }),
    )
  }

  async getWing(societyId, id) {
    const wing = await wingRepository.findInSociety(id, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const [floors, flats, vacantFlats, occupiedFlats] = await Promise.all([
      floorRepository.count({ society: societyId, wing: id, isDeleted: false }),
      flatRepository.count({ society: societyId, wing: id, isDeleted: false }),
      flatRepository.count({
        society: societyId,
        wing: id,
        isDeleted: false,
        status: FLAT_STATUS.VACANT,
      }),
      flatRepository.count({
        society: societyId,
        wing: id,
        isDeleted: false,
        status: FLAT_STATUS.OCCUPIED,
      }),
    ])

    return {
      ...sanitizeWing(wing),
      stats: {
        floors,
        flats,
        vacantFlats,
        occupiedFlats,
        occupancyRate: flats > 0 ? Math.round((occupiedFlats / flats) * 100) : 0,
      },
    }
  }

  async createWing(societyId, payload, actor, meta = {}) {
    const existing = await wingRepository.findByCode(societyId, payload.code)
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Wing code already exists')
    }

    const wing = await wingRepository.create({
      society: societyId,
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description,
      totalFloors: payload.totalFloors ?? 0,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Wing',
      entityId: wing._id,
      description: `Wing ${wing.name} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeWing(wing)
  }

  async updateWing(societyId, id, payload, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(id, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    if (payload.name !== undefined) wing.name = payload.name
    if (payload.description !== undefined) wing.description = payload.description
    if (payload.totalFloors !== undefined) wing.totalFloors = payload.totalFloors
    if (payload.isActive !== undefined) wing.isActive = payload.isActive

    await wing.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Wing',
      entityId: wing._id,
      description: `Wing ${wing.name} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeWing(wing)
  }

  async deleteWing(societyId, id, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(id, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const floorCount = await floorRepository.count({
      wing: id,
      society: societyId,
      isDeleted: false,
    })
    if (floorCount > 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot delete wing with existing floors')
    }

    wing.isDeleted = true
    wing.deletedAt = new Date()
    await wing.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Wing',
      entityId: wing._id,
      description: `Wing ${wing.name} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async listFloors(societyId, wingId) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const floors = await floorRepository.findByWing(wingId, societyId)

    return Promise.all(
      floors.map(async (floor) => {
        const flatCount = await flatRepository.count({
          society: societyId,
          floor: floor._id,
          isDeleted: false,
        })

        return {
          ...sanitizeFloor(floor),
          flatCount,
        }
      }),
    )
  }

  async listAllFloors(societyId, query = {}) {
    const isActive =
      query.isActive === undefined || query.isActive === ''
        ? undefined
        : query.isActive === true || query.isActive === 'true'

    const floors = await floorRepository.searchBySociety(societyId, {
      search: query.search,
      wingId: query.wingId,
      isActive,
    })

    return Promise.all(
      floors.map(async (floor) => {
        const flatCount = await flatRepository.count({
          society: societyId,
          floor: floor._id,
          isDeleted: false,
        })

        return {
          ...sanitizeFloor(floor),
          flatCount,
        }
      }),
    )
  }

  async getFloor(societyId, id) {
    const floor = await floorRepository.findInSociety(id, societyId)
    if (!floor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found')
    }

    const [flats, vacantFlats, occupiedFlats] = await Promise.all([
      flatRepository.count({ society: societyId, floor: id, isDeleted: false }),
      flatRepository.count({
        society: societyId,
        floor: id,
        isDeleted: false,
        status: FLAT_STATUS.VACANT,
      }),
      flatRepository.count({
        society: societyId,
        floor: id,
        isDeleted: false,
        status: FLAT_STATUS.OCCUPIED,
      }),
    ])

    return {
      ...sanitizeFloor(floor),
      flatCount: flats,
      stats: {
        flats,
        vacantFlats,
        occupiedFlats,
        occupancyRate: flats > 0 ? Math.round((occupiedFlats / flats) * 100) : 0,
      },
    }
  }

  async createFloor(societyId, wingId, payload, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const existing = await floorRepository.findByNumber(wingId, payload.floorNumber)
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Floor number already exists in this wing')
    }

    const floor = await floorRepository.create({
      society: societyId,
      wing: wingId,
      floorNumber: payload.floorNumber,
      name: payload.name || `Floor ${payload.floorNumber}`,
    })

    const floorCount = await floorRepository.count({
      wing: wingId,
      society: societyId,
      isDeleted: false,
    })
    wing.totalFloors = floorCount
    await wing.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Floor',
      entityId: floor._id,
      description: `Floor ${floor.floorNumber} created in wing ${wing.code}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeFloor(floor)
  }

  async bulkCreateFloors(societyId, wingId, payload, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const from = Number(payload.from)
    const to = Number(payload.to)
    const namePrefix = payload.namePrefix?.trim()

    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'from and to must be integers')
    }
    if (to < from) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'to must be greater than or equal to from')
    }
    if (to - from + 1 > 50) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot create more than 50 floors at once')
    }

    const created = []
    const skipped = []

    for (let floorNumber = from; floorNumber <= to; floorNumber += 1) {
      const existing = await floorRepository.findByNumber(wingId, floorNumber)
      if (existing) {
        skipped.push(floorNumber)
        continue
      }

      const name = namePrefix ? `${namePrefix} ${floorNumber}` : `Floor ${floorNumber}`
      const floor = await floorRepository.create({
        society: societyId,
        wing: wingId,
        floorNumber,
        name,
      })
      created.push(sanitizeFloor(floor))
    }

    const floorCount = await floorRepository.count({
      wing: wingId,
      society: societyId,
      isDeleted: false,
    })
    wing.totalFloors = floorCount
    await wing.save()

    if (created.length > 0) {
      await activityLogRepository.log({
        society: societyId,
        user: actor.id,
        action: ACTIVITY_ACTION.CREATE,
        entityType: 'Floor',
        entityId: wing._id,
        description: `Bulk created floors ${from}-${to} in wing ${wing.code} (${created.length} created, ${skipped.length} skipped)`,
        ip: meta.ip,
        userAgent: meta.userAgent,
      })
    }

    return { created, skipped }
  }

  async updateFloor(societyId, id, payload, actor, meta = {}) {
    const floor = await floorRepository.findInSociety(id, societyId)
    if (!floor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found')
    }

    if (payload.floorNumber !== undefined && payload.floorNumber !== floor.floorNumber) {
      const existing = await floorRepository.findByNumber(getRefId(floor.wing), payload.floorNumber)
      if (existing) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Floor number already exists in this wing')
      }
      floor.floorNumber = payload.floorNumber
    }

    if (payload.name !== undefined) floor.name = payload.name
    if (payload.isActive !== undefined) floor.isActive = payload.isActive

    await floor.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Floor',
      entityId: floor._id,
      description: `Floor ${floor.floorNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeFloor(floor)
  }

  async deleteFloor(societyId, id, actor, meta = {}) {
    const floor = await floorRepository.findInSociety(id, societyId)
    if (!floor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found')
    }

    const flatCount = await flatRepository.count({
      floor: id,
      society: societyId,
      isDeleted: false,
    })
    if (flatCount > 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot delete floor with existing flats')
    }

    floor.isDeleted = true
    floor.deletedAt = new Date()
    await floor.save()

    const wing = await wingRepository.findInSociety(getRefId(floor.wing), societyId)
    if (wing) {
      wing.totalFloors = await floorRepository.count({
        wing: wing._id,
        society: societyId,
        isDeleted: false,
      })
      await wing.save()
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Floor',
      entityId: floor._id,
      description: `Floor ${floor.floorNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async listFlats(societyId, query) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.wingId) filter.wing = query.wingId
    if (query.floorId) filter.floor = query.floorId
    if (query.status) filter.status = query.status
    if (query.type) filter.type = query.type
    if (query.search) {
      filter.flatNumber = new RegExp(escapeRegex(query.search), 'i')
    }

    const result = await flatRepository.search({ societyId, filter, page, limit })

    return {
      flats: result.data.map(sanitizeFlat),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getFlat(societyId, id) {
    const flat = await flatRepository.findInSociety(id, societyId)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found')
    }

    const [residentCount, previewMembers] = await Promise.all([
      memberRepository.countActive({ society: societyId, flat: id }),
      memberRepository.findByFlat(id, { activeOnly: true, limit: 5 }),
    ])

    const residents = previewMembers.map((m) => {
      const doc = m.toJSON ? m.toJSON() : m
      return {
        id: doc._id?.toString?.() || doc.id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
        ownershipType: doc.ownershipType,
        isPrimary: doc.isPrimary,
        isActive: doc.isActive,
      }
    })

    return {
      ...sanitizeFlat(flat),
      residentCount,
      residents,
    }
  }

  async createFlat(societyId, payload, actor, meta = {}) {
    const wing = await wingRepository.findInSociety(payload.wingId, societyId)
    if (!wing) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')
    }

    const floor = await floorRepository.findInSociety(payload.floorId, societyId)
    if (!floor) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found')
    }

    if (getRefId(floor.wing) !== payload.wingId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Floor does not belong to the selected wing')
    }

    const existing = await flatRepository.findByNumber(societyId, payload.wingId, payload.flatNumber)
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Flat number already exists in this wing')
    }

    const flat = await flatRepository.create({
      society: societyId,
      wing: payload.wingId,
      floor: payload.floorId,
      flatNumber: payload.flatNumber.toUpperCase(),
      type: payload.type,
      status: payload.status,
      areaSqFt: payload.areaSqFt,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Flat',
      entityId: flat._id,
      description: `Flat ${flat.flatNumber} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getFlat(societyId, flat._id)
  }

  async updateFlat(societyId, id, payload, actor, meta = {}) {
    const flat = await flatRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found')
    }

    if (payload.wingId || payload.floorId) {
      const wingId = payload.wingId || getRefId(flat.wing)
      const floorId = payload.floorId || getRefId(flat.floor)

      const wing = await wingRepository.findInSociety(wingId, societyId)
      if (!wing) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found')

      const floor = await floorRepository.findInSociety(floorId, societyId)
      if (!floor) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Floor not found')

      if (getRefId(floor.wing) !== wingId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Floor does not belong to the selected wing')
      }

      flat.wing = wingId
      flat.floor = floorId
    }

    if (payload.flatNumber !== undefined) {
      const existing = await flatRepository.findByNumber(
        societyId,
        getRefId(flat.wing),
        payload.flatNumber,
      )
      if (existing && existing._id.toString() !== id) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'Flat number already exists in this wing')
      }
      flat.flatNumber = payload.flatNumber.toUpperCase()
    }

    ;['type', 'status', 'areaSqFt', 'bedrooms', 'bathrooms', 'isActive'].forEach((field) => {
      if (payload[field] !== undefined) flat[field] = payload[field]
    })

    await flat.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Flat',
      entityId: flat._id,
      description: `Flat ${flat.flatNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getFlat(societyId, id)
  }

  async deleteFlat(societyId, id, actor, meta = {}) {
    const flat = await flatRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found')
    }

    flat.isDeleted = true
    flat.deletedAt = new Date()
    await flat.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Flat',
      entityId: flat._id,
      description: `Flat ${flat.flatNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }
}

export default new SocietyService()
