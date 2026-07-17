import societyRepository from '../repositories/society.repository.js'
import userRepository from '../repositories/user.repository.js'
import memberRepository from '../repositories/member.repository.js'
import supportTicketRepository from '../repositories/supportTicket.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import paymentRepository from '../repositories/payment.repository.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  MESSAGES,
  ROLES,
  SOCIETY_STATUS,
  SUPPORT_TICKET_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
    admin: doc.admin,
    settings: doc.settings,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

const sanitizeUser = (user) => {
  const doc = user.toJSON ? user.toJSON() : user
  return {
    id: doc._id?.toString?.() || doc.id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone ?? null,
    role: doc.role,
    society: doc.society ?? null,
    activeSocietyContext: doc.activeSocietyContext ?? null,
    isActive: doc.isActive,
    lastLogin: doc.lastLogin,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

class SuperAdminService {
  /**
   * Ensures a user can be assigned as society admin without cross-tenant theft
   * or demoting SUPER_ADMIN. User must be free (no society) or already on target.
   */
  async #assertAssignableSocietyAdmin(adminUser, targetSocietyId) {
    if (!adminUser || adminUser.isDeleted) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin user not found')
    }

    if (!adminUser.isActive) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Admin user is inactive')
    }

    if (adminUser.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot assign Super Admin as society admin')
    }

    if (adminUser.role !== ROLES.SOCIETY_ADMIN) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Selected user must be a Society Admin')
    }

    const currentSociety = adminUser.society?.toString?.() || null
    const target = targetSocietyId?.toString?.() || null

    if (currentSociety && target && currentSociety !== target) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'User is already assigned to another society',
      )
    }
  }

  async #assignSocietyAdmin(society, adminUser) {
    await this.#assertAssignableSocietyAdmin(adminUser, society._id)

    const previousAdminId = society.admin?.toString?.() || null
    if (previousAdminId && previousAdminId !== adminUser._id.toString()) {
      const previous = await userRepository.findById(previousAdminId)
      if (previous && previous.society?.toString() === society._id.toString()) {
        previous.society = null
        await previous.save({ validateBeforeSave: false })
      }
    }

    adminUser.society = society._id
    adminUser.role = ROLES.SOCIETY_ADMIN
    await adminUser.save({ validateBeforeSave: false })
    society.admin = adminUser._id
  }

  async getContext(userId) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (!user.activeSocietyContext) {
      return { society: null }
    }

    const society = await societyRepository.findByIdNotDeleted(user.activeSocietyContext)
    if (!society) {
      user.activeSocietyContext = null
      await user.save({ validateBeforeSave: false })
      return { society: null }
    }

    return {
      society: sanitizeSociety(society),
      isOperational: society.status === SOCIETY_STATUS.ACTIVE,
    }
  }

  async setContext(userId, societyId) {
    const user = await userRepository.findById(userId)
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (societyId === null || societyId === undefined || societyId === '') {
      user.activeSocietyContext = null
      await user.save({ validateBeforeSave: false })
      return { society: null }
    }

    const society = await societyRepository.findByIdNotDeleted(societyId)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    if (society.status !== SOCIETY_STATUS.ACTIVE) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'Only ACTIVE societies can be selected as context',
      )
    }

    user.activeSocietyContext = society._id
    await user.save({ validateBeforeSave: false })

    return {
      society: sanitizeSociety(society),
      isOperational: true,
    }
  }

  async getDashboard() {
    const [
      totalSocieties,
      activeSocieties,
      suspendedSocieties,
      totalUsers,
      societyAdmins,
      membersUsers,
      totalMembers,
      openTickets,
      totalPaymentsAmount,
      recentSocieties,
      recentActivity,
    ] = await Promise.all([
      societyRepository.count({ isDeleted: false }),
      societyRepository.count({ isDeleted: false, status: SOCIETY_STATUS.ACTIVE }),
      societyRepository.count({ isDeleted: false, status: SOCIETY_STATUS.SUSPENDED }),
      userRepository.count({ isDeleted: false }),
      userRepository.count({ isDeleted: false, role: ROLES.SOCIETY_ADMIN }),
      userRepository.count({ isDeleted: false, role: ROLES.MEMBER }),
      memberRepository.countActive(),
      supportTicketRepository.count({
        isDeleted: false,
        status: { $in: [SUPPORT_TICKET_STATUS.OPEN, SUPPORT_TICKET_STATUS.IN_PROGRESS] },
      }),
      paymentRepository.sumSuccessfulAmount(),
      societyRepository.model
        .find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('admin', 'firstName lastName email'),
      activityLogRepository.search({ page: 1, limit: 8 }),
    ])

    return {
      stats: {
        totalSocieties,
        activeSocieties,
        suspendedSocieties,
        totalUsers,
        societyAdmins,
        memberUsers: membersUsers,
        totalMembers,
        openTickets,
        totalPaymentsAmount,
      },
      recentSocieties: recentSocieties.map(sanitizeSociety),
      recentActivity: recentActivity.data,
    }
  }

  async listSocieties(query) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) {
      filter.status = query.status
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ name: regex }, { code: regex }, { email: regex }]
    }

    const result = await societyRepository.search({ filter, page, limit })

    return {
      societies: result.data.map(sanitizeSociety),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async getSocietyById(id) {
    const society = await societyRepository.model
      .findOne({ _id: id, isDeleted: false })
      .populate('admin', 'firstName lastName email phone role isActive')
      .populate('createdBy', 'firstName lastName email')

    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    return sanitizeSociety(society)
  }

  async createSociety(payload, actor, meta = {}) {
    const existingCode = await societyRepository.findByCode(payload.code)
    if (existingCode) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Society code already exists')
    }

    let adminUser = null

    if (payload.adminUserId) {
      adminUser = await userRepository.findById(payload.adminUserId)
      // Target society does not exist yet — only free (unassigned) admins allowed
      await this.#assertAssignableSocietyAdmin(adminUser, null)
      if (adminUser.society) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'User is already assigned to another society',
        )
      }
    } else if (payload.adminEmail) {
      const existingAdmin = await userRepository.findByEmail(payload.adminEmail)
      if (existingAdmin) {
        throw new ApiError(HTTP_STATUS.CONFLICT, MESSAGES.EMAIL_ALREADY_EXISTS)
      }

      if (!payload.adminPassword || !payload.adminFirstName || !payload.adminLastName) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          'adminFirstName, adminLastName and adminPassword are required when creating a new admin',
        )
      }

      adminUser = await userRepository.create({
        firstName: payload.adminFirstName,
        lastName: payload.adminLastName,
        email: payload.adminEmail,
        password: payload.adminPassword,
        role: ROLES.SOCIETY_ADMIN,
      })
    }

    const society = await societyRepository.create({
      name: payload.name,
      code: payload.code.toUpperCase(),
      registrationNumber: payload.registrationNumber,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      admin: adminUser?._id || null,
      createdBy: actor.id,
    })

    if (adminUser) {
      adminUser.society = society._id
      adminUser.role = ROLES.SOCIETY_ADMIN
      await adminUser.save({ validateBeforeSave: false })
    }

    await activityLogRepository.log({
      society: society._id,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Society',
      entityId: society._id,
      description: `Society ${society.name} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    const populated = await societyRepository.model
      .findById(society._id)
      .populate('admin', 'firstName lastName email phone role isActive')

    return sanitizeSociety(populated)
  }

  async updateSociety(id, payload, actor, meta = {}) {
    const society = await societyRepository.findActiveById(id)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    if (payload.admin) {
      const adminUser = await userRepository.findById(payload.admin)
      await this.#assignSocietyAdmin(society, adminUser)
    }

    if (payload.name !== undefined) society.name = payload.name
    if (payload.email !== undefined) society.email = payload.email
    if (payload.phone !== undefined) society.phone = payload.phone
    if (payload.registrationNumber !== undefined) {
      society.registrationNumber = payload.registrationNumber
    }
    if (payload.address !== undefined) society.address = payload.address

    await society.save()

    await activityLogRepository.log({
      society: society._id,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Society',
      entityId: society._id,
      description: `Society ${society.name} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getSocietyById(id)
  }

  async updateSocietyStatus(id, status, actor, meta = {}) {
    const society = await societyRepository.findActiveById(id)
    if (!society) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
    }

    society.status = status
    await society.save()

    await activityLogRepository.log({
      society: society._id,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Society',
      entityId: society._id,
      description: `Society status changed to ${status}`,
      metadata: { status },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeSociety(society)
  }

  async listUsers(query) {
    const { page, limit, skip } = getPagination(query.page, query.limit)
    const filter = { isDeleted: false }

    if (query.role) filter.role = query.role
    if (query.societyId) filter.society = query.societyId
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true'

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }]
    }

    const [data, total] = await Promise.all([
      userRepository.model
        .find(filter)
        .populate('society', 'name code status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      userRepository.count(filter),
    ])

    return {
      users: data.map(sanitizeUser),
      pagination: getPaginationMeta(total, page, limit),
    }
  }

  async updateUserStatus(id, isActive, actor, meta = {}) {
    const user = await userRepository.findById(id)
    if (!user || user.isDeleted) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot change Super Admin status')
    }

    if (user._id.toString() === actor.id) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot change your own status')
    }

    user.isActive = isActive
    await user.save({ validateBeforeSave: false })

    await activityLogRepository.log({
      society: user.society,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'User',
      entityId: user._id,
      description: `User ${user.email} ${isActive ? 'activated' : 'deactivated'}`,
      metadata: { isActive },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return sanitizeUser(user)
  }

  async listSupportTickets(query) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ subject: regex }, { ticketNumber: regex }]
    }

    const result = await supportTicketRepository.search({ filter, page, limit })

    return {
      tickets: result.data,
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async updateSupportTicket(id, payload, actor, meta = {}) {
    const ticket = await supportTicketRepository.findById(id)
    if (!ticket || ticket.isDeleted) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Support ticket not found')
    }

    if (payload.status !== undefined) {
      ticket.status = payload.status
      if (payload.status === SUPPORT_TICKET_STATUS.RESOLVED) {
        ticket.resolvedAt = new Date()
      }
      if (payload.status === SUPPORT_TICKET_STATUS.CLOSED) {
        ticket.closedAt = new Date()
      }
    }

    if (payload.assignedTo !== undefined) {
      ticket.assignedTo = payload.assignedTo || null
    }

    if (payload.priority !== undefined) {
      ticket.priority = payload.priority
    }

    await ticket.save()

    await activityLogRepository.log({
      society: ticket.society,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'SupportTicket',
      entityId: ticket._id,
      description: `Support ticket ${ticket.ticketNumber} updated`,
      metadata: payload,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return supportTicketRepository.model
      .findById(ticket._id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('society', 'name code')
  }

  async listActivityLogs(query) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.action) filter.action = query.action
    if (query.entityType) filter.entityType = query.entityType

    const result = await activityLogRepository.search({ filter, page, limit })

    return {
      logs: result.data,
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }
}

export default new SuperAdminService()
