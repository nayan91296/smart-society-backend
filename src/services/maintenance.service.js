import maintenanceRepository from '../repositories/maintenance.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import Complaint from '../models/complaint.model.js'
import Staff from '../models/staff.model.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  generateWorkOrderNumber,
  sanitizeMaintenance,
} from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  COMPLAINT_PRIORITY,
  HTTP_STATUS,
  MAINTENANCE_STATUS,
  MESSAGES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class MaintenanceService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.priority) filter.priority = query.priority
    if (query.flatId) filter.flat = query.flatId
    if (query.category) filter.category = new RegExp(escapeRegex(query.category), 'i')

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [
        { title: regex },
        { description: regex },
        { workOrderNumber: regex },
        { category: regex },
      ]
    }

    const result = await maintenanceRepository.search({ societyId, filter, page, limit })

    return {
      maintenance: result.data.map(sanitizeMaintenance),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async get(societyId, id) {
    const item = await maintenanceRepository.findInSociety(id, societyId)
    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Maintenance work order not found')
    }
    return sanitizeMaintenance(item)
  }

  async #validateRefs(societyId, payload) {
    if (payload.flatId) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    if (payload.assignedStaffId) {
      const staff = await Staff.findOne({
        _id: payload.assignedStaffId,
        society: societyId,
        isDeleted: false,
      })
      if (!staff) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Staff not found in this society')
    }

    if (payload.relatedComplaintId) {
      const complaint = await Complaint.findOne({
        _id: payload.relatedComplaintId,
        society: societyId,
        isDeleted: false,
      })
      if (!complaint) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Related complaint not found')
      }
    }
  }

  #applyStatus(item, status) {
    if (!Object.values(MAINTENANCE_STATUS).includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid maintenance status')
    }

    item.status = status

    if (status === MAINTENANCE_STATUS.COMPLETED) {
      if (!item.completedAt) item.completedAt = new Date()
    } else if (item.completedAt && status !== MAINTENANCE_STATUS.COMPLETED) {
      item.completedAt = undefined
    }
  }

  async create(societyId, payload, actor, meta = {}) {
    await this.#validateRefs(societyId, payload)

    if (payload.scheduledAt && Number.isNaN(new Date(payload.scheduledAt).getTime())) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid scheduledAt')
    }

    if (payload.estimatedCost !== undefined && payload.estimatedCost < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'estimatedCost must be >= 0')
    }

    if (payload.actualCost !== undefined && payload.actualCost < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'actualCost must be >= 0')
    }

    const item = await maintenanceRepository.create({
      society: societyId,
      flat: payload.flatId || null,
      workOrderNumber: generateWorkOrderNumber(),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority || COMPLAINT_PRIORITY.MEDIUM,
      status: payload.status || MAINTENANCE_STATUS.OPEN,
      scheduledAt: payload.scheduledAt || undefined,
      estimatedCost: payload.estimatedCost ?? 0,
      actualCost: payload.actualCost,
      assignedStaff: payload.assignedStaffId || null,
      raisedBy: actor.id,
      relatedComplaint: payload.relatedComplaintId || null,
      notes: payload.notes,
    })

    if (item.status === MAINTENANCE_STATUS.COMPLETED) {
      item.completedAt = new Date()
      await item.save()
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Maintenance',
      entityId: item._id,
      description: `Work order ${item.workOrderNumber} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, item._id)
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const item = await maintenanceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Maintenance work order not found')
    }

    await this.#validateRefs(societyId, {
      flatId: payload.flatId,
      assignedStaffId: payload.assignedStaffId,
      relatedComplaintId: payload.relatedComplaintId,
    })

    ;['title', 'description', 'category', 'priority', 'notes'].forEach((field) => {
      if (payload[field] !== undefined) item[field] = payload[field]
    })

    if (payload.flatId !== undefined) item.flat = payload.flatId || null
    if (payload.assignedStaffId !== undefined) {
      item.assignedStaff = payload.assignedStaffId || null
    }
    if (payload.relatedComplaintId !== undefined) {
      item.relatedComplaint = payload.relatedComplaintId || null
    }

    if (payload.scheduledAt !== undefined) {
      if (payload.scheduledAt && Number.isNaN(new Date(payload.scheduledAt).getTime())) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid scheduledAt')
      }
      item.scheduledAt = payload.scheduledAt || undefined
    }

    if (payload.estimatedCost !== undefined) {
      if (payload.estimatedCost < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'estimatedCost must be >= 0')
      }
      item.estimatedCost = payload.estimatedCost
    }

    if (payload.actualCost !== undefined) {
      if (payload.actualCost < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'actualCost must be >= 0')
      }
      item.actualCost = payload.actualCost
    }

    if (payload.status !== undefined && payload.status !== item.status) {
      this.#applyStatus(item, payload.status)
    }

    await item.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Maintenance',
      entityId: item._id,
      description: `Work order ${item.workOrderNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async updateStatus(societyId, id, payload, actor, meta = {}) {
    const item = await maintenanceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Maintenance work order not found')
    }

    this.#applyStatus(item, payload.status)

    if (payload.notes !== undefined) item.notes = payload.notes
    if (payload.actualCost !== undefined) {
      if (payload.actualCost < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'actualCost must be >= 0')
      }
      item.actualCost = payload.actualCost
    }

    await item.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Maintenance',
      entityId: item._id,
      description: `Work order ${item.workOrderNumber} status changed to ${item.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const item = await maintenanceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Maintenance work order not found')
    }

    item.isDeleted = true
    item.deletedAt = new Date()
    await item.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Maintenance',
      entityId: item._id,
      description: `Work order ${item.workOrderNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }
}

export default new MaintenanceService()
