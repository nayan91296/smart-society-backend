import invoiceRepository from '../repositories/invoice.repository.js'
import flatRepository from '../repositories/flat.repository.js'
import memberRepository from '../repositories/member.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import paymentRepository from '../repositories/payment.repository.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { generateInvoiceNumber, sanitizeInvoice } from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  MESSAGES,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const computeItems = (items = []) => {
  const computed = items.map((item) => {
    const quantity = Number(item.quantity ?? 1)
    const unitPrice = Number(item.unitPrice)
    if (Number.isNaN(quantity) || quantity < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Item quantity must be >= 0')
    }
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Item unitPrice must be >= 0')
    }
    return {
      description: item.description,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
    }
  })

  const subtotal = computed.reduce((sum, item) => sum + item.amount, 0)
  return { items: computed, subtotal }
}

class InvoiceService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.type) filter.type = query.type
    if (query.flatId) filter.flat = query.flatId
    if (query.memberId) filter.member = query.memberId

    if (query.periodStart || query.periodEnd) {
      if (query.periodStart) filter.periodStart = { ...(filter.periodStart || {}), $gte: new Date(query.periodStart) }
      if (query.periodEnd) filter.periodEnd = { ...(filter.periodEnd || {}), $lte: new Date(query.periodEnd) }
    }

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ invoiceNumber: regex }, { notes: regex }]
    }

    const result = await invoiceRepository.search({ societyId, filter, page, limit })

    return {
      invoices: result.data.map(sanitizeInvoice),
      pagination: getPaginationMeta(result.total, page, limit),
    }
  }

  async listForMember(member, query = {}) {
    return this.list(member.society, {
      ...query,
      flatId: member.flat,
    })
  }

  async get(societyId, id) {
    const invoice = await invoiceRepository.findInSociety(id, societyId)
    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }
    return sanitizeInvoice(invoice)
  }

  async getForMember(member, id) {
    const invoice = await invoiceRepository.model
      .findOne({
        _id: id,
        society: member.society,
        flat: member.flat,
        isDeleted: false,
      })
      .populate({
        path: 'flat',
        select: 'flatNumber wing floor',
        populate: [
          { path: 'wing', select: 'name code' },
          { path: 'floor', select: 'floorNumber name' },
        ],
      })
      .populate('member', 'firstName lastName phone email')

    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }

    return sanitizeInvoice(invoice)
  }

  async #resolveMemberForFlat(societyId, flatId, memberId) {
    if (memberId) {
      const member = await memberRepository.findInSociety(memberId, societyId)
      if (!member) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Member not found')
      const memberFlat = member.flat?._id?.toString?.() || member.flat?.toString?.() || member.flat
      if (memberFlat?.toString() !== flatId.toString()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Member does not belong to the selected flat')
      }
      return member._id
    }

    const primaries = await memberRepository.findByFlat(flatId, {
      societyId,
      activeOnly: true,
      limit: 1,
    })
    return primaries[0]?._id || null
  }

  async #assertNoDuplicate(societyId, flatId, type, periodStart, periodEnd, excludeId) {
    if (!periodStart || !periodEnd) return
    const existing = await invoiceRepository.findDuplicatePeriod({
      societyId,
      flatId,
      type,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      excludeId,
    })
    if (existing) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        'An invoice already exists for this flat, type, and period',
      )
    }
  }

  async create(societyId, payload, actor, meta = {}) {
    const flat = await flatRepository.findInSociety(payload.flatId, societyId)
    if (!flat) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
    }

    const type = payload.type || INVOICE_TYPE.MAINTENANCE
    await this.#assertNoDuplicate(
      societyId,
      payload.flatId,
      type,
      payload.periodStart,
      payload.periodEnd,
    )

    const { items, subtotal } = computeItems(payload.items || [])
    const taxAmount = Number(payload.taxAmount ?? 0)
    if (taxAmount < 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'taxAmount must be >= 0')
    }

    const memberId = await this.#resolveMemberForFlat(societyId, payload.flatId, payload.memberId)

    const invoice = await invoiceRepository.create({
      society: societyId,
      flat: payload.flatId,
      member: memberId,
      invoiceNumber: generateInvoiceNumber(),
      type,
      items,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      amountPaid: 0,
      periodStart: payload.periodStart || undefined,
      periodEnd: payload.periodEnd || undefined,
      issueDate: payload.issueDate || new Date(),
      dueDate: payload.dueDate,
      status: INVOICE_STATUS.DRAFT,
      notes: payload.notes,
      createdBy: actor.id,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Invoice ${invoice.invoiceNumber} created`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, invoice._id)
  }

  async bulkCreate(societyId, payload, actor, meta = {}) {
    let flatIds = payload.flatIds

    if (flatIds === undefined || flatIds === null) {
      const flats = await flatRepository.find({
        society: societyId,
        isDeleted: false,
        isActive: true,
      })
      flatIds = flats.map((f) => f._id.toString())
    }

    const created = []
    const skipped = []

    for (const flatId of flatIds) {
      try {
        const flat = await flatRepository.findInSociety(flatId, societyId)
        if (!flat) {
          skipped.push({ flatId, reason: 'Flat not found' })
          continue
        }

        const type = payload.type || INVOICE_TYPE.MAINTENANCE
        const duplicate = await invoiceRepository.findDuplicatePeriod({
          societyId,
          flatId,
          type,
          periodStart: new Date(payload.periodStart),
          periodEnd: new Date(payload.periodEnd),
        })

        if (duplicate) {
          skipped.push({ flatId, reason: 'Duplicate period invoice', invoiceId: duplicate._id })
          continue
        }

        const invoice = await this.create(
          societyId,
          {
            flatId,
            type,
            items: payload.items,
            taxAmount: payload.taxAmount,
            periodStart: payload.periodStart,
            periodEnd: payload.periodEnd,
            issueDate: payload.issueDate,
            dueDate: payload.dueDate,
            notes: payload.notes,
          },
          actor,
          meta,
        )
        created.push(invoice)
      } catch (error) {
        skipped.push({ flatId, reason: error.message || 'Failed to create' })
      }
    }

    return { created, skipped }
  }

  async update(societyId, id, payload, actor, meta = {}) {
    const invoice = await invoiceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }

    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only DRAFT invoices can be edited')
    }

    if (payload.flatId) {
      const flat = await flatRepository.findInSociety(payload.flatId, societyId)
      if (!flat) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
      invoice.flat = payload.flatId
    }

    if (payload.memberId !== undefined) {
      invoice.member = await this.#resolveMemberForFlat(
        societyId,
        invoice.flat.toString(),
        payload.memberId || null,
      )
    }

    if (payload.type !== undefined) invoice.type = payload.type
    if (payload.notes !== undefined) invoice.notes = payload.notes
    if (payload.dueDate !== undefined) invoice.dueDate = payload.dueDate
    if (payload.issueDate !== undefined) invoice.issueDate = payload.issueDate
    if (payload.periodStart !== undefined) invoice.periodStart = payload.periodStart || undefined
    if (payload.periodEnd !== undefined) invoice.periodEnd = payload.periodEnd || undefined

    if (payload.items !== undefined) {
      const { items, subtotal } = computeItems(payload.items)
      invoice.items = items
      invoice.subtotal = subtotal
    }

    if (payload.taxAmount !== undefined) {
      if (payload.taxAmount < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'taxAmount must be >= 0')
      }
      invoice.taxAmount = payload.taxAmount
    }

    invoice.totalAmount = (invoice.subtotal || 0) + (invoice.taxAmount || 0)

    await this.#assertNoDuplicate(
      societyId,
      invoice.flat,
      invoice.type,
      invoice.periodStart,
      invoice.periodEnd,
      invoice._id,
    )

    await invoice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Invoice ${invoice.invoiceNumber} updated`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async updateStatus(societyId, id, payload, actor, meta = {}) {
    const invoice = await invoiceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }

    const next = payload.status

    if (next === INVOICE_STATUS.ISSUED || next === 'ISSUE') {
      if (invoice.status !== INVOICE_STATUS.DRAFT) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only DRAFT invoices can be issued')
      }
      invoice.status = INVOICE_STATUS.ISSUED
      if (!invoice.issueDate) invoice.issueDate = new Date()
    } else if (next === INVOICE_STATUS.CANCELLED || next === 'CANCEL') {
      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Paid invoices cannot be cancelled')
      }
      invoice.status = INVOICE_STATUS.CANCELLED
    } else if (next === INVOICE_STATUS.OVERDUE) {
      if (
        ![INVOICE_STATUS.ISSUED, INVOICE_STATUS.PARTIALLY_PAID, INVOICE_STATUS.OVERDUE].includes(
          invoice.status,
        )
      ) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only unpaid issued invoices can be marked overdue')
      }
      if (invoice.amountPaid >= invoice.totalAmount && invoice.totalAmount > 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Fully paid invoices cannot be marked overdue')
      }
      invoice.status = INVOICE_STATUS.OVERDUE
    } else if (Object.values(INVOICE_STATUS).includes(next)) {
      invoice.status = next
    } else {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid invoice status action')
    }

    await invoice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Invoice ${invoice.invoiceNumber} status changed to ${invoice.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const invoice = await invoiceRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }

    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only DRAFT invoices can be deleted')
    }

    const paymentCount = await paymentRepository.count({
      invoice: id,
      isDeleted: false,
    })
    if (paymentCount > 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot delete invoice with payments')
    }

    invoice.isDeleted = true
    invoice.deletedAt = new Date()
    await invoice.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Invoice ${invoice.invoiceNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }

  async recomputePaidAmount(invoiceId) {
    const invoice = await invoiceRepository.model.findOne({ _id: invoiceId, isDeleted: false })
    if (!invoice) return null

    const amountPaid = await paymentRepository.sumSuccessfulForInvoice(invoice._id)
    invoice.amountPaid = amountPaid

    if (invoice.status !== INVOICE_STATUS.CANCELLED && invoice.status !== INVOICE_STATUS.DRAFT) {
      if (amountPaid <= 0) {
        if (invoice.status !== INVOICE_STATUS.OVERDUE) {
          invoice.status = INVOICE_STATUS.ISSUED
        }
      } else if (amountPaid >= invoice.totalAmount) {
        invoice.status = INVOICE_STATUS.PAID
      } else {
        invoice.status = INVOICE_STATUS.PARTIALLY_PAID
      }
    }

    await invoice.save()
    return invoice
  }
}

export default new InvoiceService()
