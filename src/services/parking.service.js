import parkingRepository from '../repositories/parking.repository.js'
import vehicleRepository from '../repositories/vehicle.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import wingRepository from '../repositories/wing.repository.js'
import memberRepository from '../repositories/member.repository.js'
import societyRepository from '../repositories/society.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import notificationDispatchService from './notifications/dispatch.service.js'
import { getPagination, getPaginationMeta, sanitizeParking, sanitizeVehicle } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
  PARKING_STATUS,
  PARKING_TYPE,
  VEHICLE_TYPE,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getRefId = (ref) => {
  if (!ref) return null
  if (typeof ref === 'string') return ref
  return ref._id?.toString?.() || ref.id?.toString?.() || null
}

class ParkingService {
  // ─── Parking slots ───────────────────────────────────────────────

  async listParking(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.type) filter.type = query.type
    if (query.wingId) filter.wing = query.wingId
    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === true || query.isActive === 'true'
    }
    if (query.available === true || query.available === 'true') {
      filter.status = PARKING_STATUS.AVAILABLE
      filter.assignedVehicle = null
    }
    if (query.search) {
      filter.slotNumber = new RegExp(escapeRegex(query.search), 'i')
    }

    const result = await parkingRepository.search({ societyId, filter, page, limit })

    return {
      parkingSlots: result.data.map(sanitizeParking),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getParking(societyId, id) {
    const parking = await parkingRepository.findInSociety(id, societyId)
    if (!parking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parking slot not found')
    }
    return sanitizeParking(parking)
  }

  async createParking(societyId, payload, actor, meta = {}) {
    const slotNumber = payload.slotNumber.trim().toUpperCase()
    const existing = await parkingRepository.findBySlot(societyId, slotNumber)
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Parking slot number already exists')
    }

    if (payload.wingId) {
      const wing = await wingRepository.findInSociety(payload.wingId, societyId)
      if (!wing) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found in this society')
      }
    }

    let status = payload.status || PARKING_STATUS.AVAILABLE
    if (status === PARKING_STATUS.OCCUPIED) {
      status = PARKING_STATUS.AVAILABLE
    }

    const parking = await parkingRepository.create({
      society: societyId,
      slotNumber,
      wing: payload.wingId || null,
      type: payload.type || PARKING_TYPE.OPEN,
      status,
      notes: payload.notes,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Parking',
      entityId: parking._id,
      description: `Parking slot ${parking.slotNumber} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getParking(societyId, parking._id)
  }

  async updateParking(societyId, id, payload, actor, meta = {}) {
    const parking = await parkingRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!parking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parking slot not found')
    }

    if (payload.slotNumber !== undefined) {
      const slotNumber = payload.slotNumber.trim().toUpperCase()
      if (slotNumber !== parking.slotNumber) {
        const existing = await parkingRepository.findBySlot(societyId, slotNumber)
        if (existing) {
          throw new ApiError(HTTP_STATUS.CONFLICT, 'Parking slot number already exists')
        }
        parking.slotNumber = slotNumber
      }
    }

    if (payload.wingId !== undefined) {
      if (payload.wingId) {
        const wing = await wingRepository.findInSociety(payload.wingId, societyId)
        if (!wing) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Wing not found in this society')
        }
        parking.wing = payload.wingId
      } else {
        parking.wing = null
      }
    }

    if (payload.type !== undefined) parking.type = payload.type
    if (payload.notes !== undefined) parking.notes = payload.notes
    if (payload.isActive !== undefined) parking.isActive = payload.isActive

    if (payload.status !== undefined && payload.status !== parking.status) {
      this.#applyParkingStatus(parking, payload.status)
    }

    await parking.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Parking',
      entityId: parking._id,
      description: `Parking slot ${parking.slotNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getParking(societyId, id)
  }

  #applyParkingStatus(parking, status) {
    if (!Object.values(PARKING_STATUS).includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid parking status')
    }

    if (status === PARKING_STATUS.AVAILABLE && parking.assignedVehicle) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Unassign the vehicle before marking the slot available',
      )
    }

    if (status === PARKING_STATUS.OCCUPIED && !parking.assignedVehicle) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Assign a vehicle before marking the slot occupied',
      )
    }

    if (status === PARKING_STATUS.BLOCKED && parking.assignedVehicle) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Unassign the vehicle before blocking the slot',
      )
    }

    parking.status = status
  }

  async softDeleteParking(societyId, id, actor, meta = {}) {
    const parking = await parkingRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!parking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parking slot not found')
    }

    if (parking.assignedVehicle) {
      await this.#clearAssignment(parking)
    }

    parking.isDeleted = true
    parking.deletedAt = new Date()
    parking.isActive = false
    parking.status = PARKING_STATUS.AVAILABLE
    await parking.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Parking',
      entityId: parking._id,
      description: `Parking slot ${parking.slotNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async assignVehicle(societyId, parkingId, { vehicleId }, actor, meta = {}) {
    const parking = await parkingRepository.model.findOne({
      _id: parkingId,
      society: societyId,
      isDeleted: false,
    })
    if (!parking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parking slot not found')
    }

    if (!parking.isActive) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Parking slot is inactive')
    }

    if ([PARKING_STATUS.BLOCKED].includes(parking.status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot assign vehicle to a blocked slot')
    }

    if (parking.assignedVehicle) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Parking slot already has an assigned vehicle')
    }

    const vehicle = await vehicleRepository.model.findOne({
      _id: vehicleId,
      society: societyId,
      isDeleted: false,
    })
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }

    if (!vehicle.isActive) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Vehicle is inactive')
    }

    if (vehicle.parking) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Vehicle is already assigned to another parking slot')
    }

    parking.assignedVehicle = vehicle._id
    parking.assignedFlat = vehicle.flat
    parking.status = PARKING_STATUS.OCCUPIED
    await parking.save()

    vehicle.parking = parking._id
    await vehicle.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Parking',
      entityId: parking._id,
      description: `Vehicle ${vehicle.vehicleNumber} assigned to slot ${parking.slotNumber}`,
      metadata: { vehicleId: vehicle._id },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    await this.#notifyVehicleOwner(societyId, vehicle, parking, actor.id)

    return this.getParking(societyId, parkingId)
  }

  async #notifyVehicleOwner(societyId, vehicle, parking, actorId) {
    try {
      let userId = null
      if (vehicle.member) {
        const member = await memberRepository.findInSociety(getRefId(vehicle.member), societyId)
        userId = getRefId(member?.user)
      }
      if (!userId) return

      await notificationDispatchService.dispatchToUser({
        userId,
        societyId,
        title: 'Parking assigned',
        message: `Your vehicle ${vehicle.vehicleNumber} was assigned to slot ${parking.slotNumber}`,
        type: NOTIFICATION_TYPE.PARKING,
        data: {
          parkingId: parking._id.toString(),
          vehicleId: vehicle._id.toString(),
          slotNumber: parking.slotNumber,
        },
        entityType: 'Parking',
        entityId: parking._id,
        channels: [NOTIFICATION_CHANNEL.IN_APP, NOTIFICATION_CHANNEL.EMAIL],
        createdBy: actorId,
      })
    } catch {
      // Non-blocking
    }
  }

  async unassignVehicle(societyId, parkingId, actor, meta = {}) {
    const parking = await parkingRepository.model.findOne({
      _id: parkingId,
      society: societyId,
      isDeleted: false,
    })
    if (!parking) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Parking slot not found')
    }

    if (!parking.assignedVehicle) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Parking slot has no assigned vehicle')
    }

    const vehicleNumber = await this.#clearAssignment(parking)

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Parking',
      entityId: parking._id,
      description: `Vehicle ${vehicleNumber || ''} unassigned from slot ${parking.slotNumber}`.trim(),
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getParking(societyId, parkingId)
  }

  async #clearAssignment(parking) {
    const vehicleId = getRefId(parking.assignedVehicle)
    let vehicleNumber = null

    if (vehicleId) {
      const vehicle = await vehicleRepository.model.findOne({
        _id: vehicleId,
        isDeleted: false,
      })
      if (vehicle) {
        vehicleNumber = vehicle.vehicleNumber
        vehicle.parking = null
        await vehicle.save()
      }
    }

    parking.assignedVehicle = null
    parking.assignedFlat = null
    if (parking.status === PARKING_STATUS.OCCUPIED) {
      parking.status = PARKING_STATUS.AVAILABLE
    }
    await parking.save()

    return vehicleNumber
  }

  // ─── Vehicles (admin) ────────────────────────────────────────────

  async listVehicles(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.flatId) filter.flat = query.flatId
    if (query.memberId) filter.member = query.memberId
    if (query.type) filter.type = query.type
    if (query.isActive !== undefined && query.isActive !== '') {
      filter.isActive = query.isActive === true || query.isActive === 'true'
    }
    if (query.assigned === true || query.assigned === 'true') {
      filter.parking = { $ne: null }
    }
    if (query.assigned === false || query.assigned === 'false') {
      filter.parking = null
    }
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ vehicleNumber: regex }, { make: regex }, { model: regex }, { color: regex }]
    }

    const result = await vehicleRepository.search({ societyId, filter, page, limit })

    return {
      vehicles: result.data.map(sanitizeVehicle),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getVehicle(societyId, id) {
    const vehicle = await vehicleRepository.findInSociety(id, societyId)
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }
    return sanitizeVehicle(vehicle)
  }

  async createVehicle(societyId, payload, actor, meta = {}) {
    const flat = await flatRepository.findInSociety(payload.flatId, societyId)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    const memberId = payload.memberId || null
    if (memberId) {
      const member = await memberRepository.findInSociety(memberId, societyId)
      if (!member) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
      }
      const memberFlatId = getRefId(member.flat)
      if (memberFlatId !== flat._id.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Member does not belong to the selected flat')
      }
    }

    const vehicleNumber = payload.vehicleNumber.trim().toUpperCase()
    const existing = await vehicleRepository.findByNumber(societyId, vehicleNumber)
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Vehicle number already registered in this society')
    }

    const vehicle = await vehicleRepository.create({
      society: societyId,
      flat: flat._id,
      member: memberId,
      vehicleNumber,
      type: payload.type || VEHICLE_TYPE.FOUR_WHEELER,
      make: payload.make,
      model: payload.model,
      color: payload.color,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Vehicle',
      entityId: vehicle._id,
      description: `Vehicle ${vehicle.vehicleNumber} registered`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getVehicle(societyId, vehicle._id)
  }

  async updateVehicle(societyId, id, payload, actor, meta = {}) {
    const vehicle = await vehicleRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }

    if (payload.flatId !== undefined) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
      }
      vehicle.flat = flat._id
      if (vehicle.parking) {
        const parking = await parkingRepository.model.findOne({
          _id: vehicle.parking,
          isDeleted: false,
        })
        if (parking) {
          parking.assignedFlat = flat._id
          await parking.save()
        }
      }
    }

    if (payload.memberId !== undefined) {
      if (payload.memberId) {
        const member = await memberRepository.findInSociety(payload.memberId, societyId)
        if (!member) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
        }
        const memberFlatId = getRefId(member.flat)
        const vehicleFlatId = getRefId(vehicle.flat)
        if (memberFlatId !== vehicleFlatId) {
          throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Member does not belong to the vehicle flat')
        }
        vehicle.member = payload.memberId
      } else {
        vehicle.member = null
      }
    }

    if (payload.vehicleNumber !== undefined) {
      const vehicleNumber = payload.vehicleNumber.trim().toUpperCase()
      if (vehicleNumber !== vehicle.vehicleNumber) {
        const existing = await vehicleRepository.findByNumber(societyId, vehicleNumber)
        if (existing) {
          throw new ApiError(HTTP_STATUS.CONFLICT, 'Vehicle number already registered in this society')
        }
        vehicle.vehicleNumber = vehicleNumber
      }
    }

    ;['type', 'make', 'model', 'color'].forEach((field) => {
      if (payload[field] !== undefined) vehicle[field] = payload[field]
    })
    if (payload.isActive !== undefined) vehicle.isActive = payload.isActive

    await vehicle.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Vehicle',
      entityId: vehicle._id,
      description: `Vehicle ${vehicle.vehicleNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getVehicle(societyId, id)
  }

  async softDeleteVehicle(societyId, id, actor, meta = {}) {
    const vehicle = await vehicleRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }

    if (vehicle.parking) {
      const parking = await parkingRepository.model.findOne({
        _id: vehicle.parking,
        isDeleted: false,
      })
      if (parking) {
        await this.#clearAssignment(parking)
      } else {
        vehicle.parking = null
      }
    }

    vehicle.isDeleted = true
    vehicle.deletedAt = new Date()
    vehicle.isActive = false
    vehicle.parking = null
    await vehicle.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Vehicle',
      entityId: vehicle._id,
      description: `Vehicle ${vehicle.vehicleNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  // ─── Member self-service ─────────────────────────────────────────

  async listMemberVehicles(societyId, member) {
    const result = await vehicleRepository.search({
      societyId,
      filter: {
        $or: [{ member: member.id }, { flat: member.flat }],
      },
      page: 1,
      limit: 100,
    })
    return { vehicles: result.data.map(sanitizeVehicle) }
  }

  async createMemberVehicle(societyId, member, payload, actor, meta = {}) {
    const society = await societyRepository.findActiveById(societyId)
    if (society?.settings?.allowMemberVehicleRegistration === false) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Member vehicle registration is disabled for this society',
      )
    }

    return this.createVehicle(
      societyId,
      {
        ...payload,
        flatId: member.flat,
        memberId: member.id,
      },
      actor,
      meta,
    )
  }

  async updateMemberVehicle(societyId, member, id, payload, actor, meta = {}) {
    const vehicle = await vehicleRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
      $or: [{ member: member.id }, { flat: member.flat }],
    })
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }

    const safePayload = { ...payload }
    delete safePayload.flatId
    delete safePayload.memberId
    delete safePayload.isActive

    return this.updateVehicle(societyId, id, safePayload, actor, meta)
  }

  async deleteMemberVehicle(societyId, member, id, actor, meta = {}) {
    const vehicle = await vehicleRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
      $or: [{ member: member.id }, { flat: member.flat }],
    })
    if (!vehicle) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Vehicle not found')
    }

    return this.softDeleteVehicle(societyId, id, actor, meta)
  }

  async getMemberParking(societyId, member) {
    const vehicles = await vehicleRepository.model
      .find({
        society: societyId,
        isDeleted: false,
        parking: { $ne: null },
        $or: [{ member: member.id }, { flat: member.flat }],
      })
      .populate({
        path: 'parking',
        populate: [
          { path: 'wing', select: 'name code' },
          { path: 'assignedFlat', select: 'flatNumber wing', populate: { path: 'wing', select: 'name code' } },
        ],
      })

    const parkingSlots = vehicles
      .filter((v) => v.parking)
      .map((v) => {
        const slot = sanitizeParking(v.parking)
        return {
          ...slot,
          vehicle: {
            id: v._id.toString(),
            vehicleNumber: v.vehicleNumber,
            type: v.type,
            make: v.make,
            model: v.model,
            color: v.color,
          },
        }
      })

    return { parkingSlots }
  }
}

export default new ParkingService()
