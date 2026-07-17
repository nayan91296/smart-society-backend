import paymentRepository from '../repositories/payment.repository.js'
import invoiceRepository from '../repositories/invoice.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import invoiceService from './invoice.service.js'
import { getPagination, getPaginationMeta } from '../helpers/index.js'
import { generatePaymentNumber, sanitizePayment } from '../helpers/entity.helper.js'
import {
  ACTIVITY_ACTION,
  HTTP_STATUS,
  INVOICE_STATUS,
  MESSAGES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class PaymentService {
  async list(societyId, query = {}) {
    const { page, limit } = getPagination(query.page, query.limit)
    const filter = {}

    if (query.status) filter.status = query.status
    if (query.method) filter.method = query.method
    if (query.invoiceId) filter.invoice = query.invoiceId
    if (query.flatId) filter.flat = query.flatId

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i')
      filter.$or = [{ paymentNumber: regex }, { transactionId: regex }, { notes: regex }]
    }

    const result = await paymentRepository.search({ societyId, filter, page, limit })

    return {
      payments: result.data.map(sanitizePayment),
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
    const payment = await paymentRepository.findInSociety(id, societyId)
    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found')
    }
    return sanitizePayment(payment)
  }

  async getForMember(member, id) {
    const payment = await paymentRepository.model
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
      .populate('invoice', 'invoiceNumber totalAmount amountPaid status type dueDate')

    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found')
    }

    return sanitizePayment(payment)
  }

  async create(societyId, payload, actor, meta = {}) {
    const invoice = await invoiceRepository.model.findOne({
      _id: payload.invoiceId,
      society: societyId,
      isDeleted: false,
    })
    if (!invoice) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Invoice not found')
    }

    if ([INVOICE_STATUS.DRAFT, INVOICE_STATUS.CANCELLED].includes(invoice.status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Cannot record payment for draft or cancelled invoices')
    }

    const amount = Number(payload.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment amount must be greater than 0')
    }

    const currentPaid = await paymentRepository.sumSuccessfulForInvoice(invoice._id)
    const balanceDue = Math.max(0, (invoice.totalAmount || 0) - currentPaid)
    if (amount > balanceDue) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Payment amount cannot exceed balance due (${balanceDue})`,
      )
    }

    const status = payload.status || PAYMENT_STATUS.SUCCESS
    if (![PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PENDING].includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Manual payments may only be SUCCESS or PENDING')
    }

    const payment = await paymentRepository.create({
      society: societyId,
      invoice: invoice._id,
      flat: invoice.flat,
      member: invoice.member || null,
      paymentNumber: generatePaymentNumber(),
      amount,
      method: payload.method || PAYMENT_METHOD.CASH,
      transactionId: payload.transactionId,
      status,
      paidAt: payload.paidAt || (status === PAYMENT_STATUS.SUCCESS ? new Date() : undefined),
      notes: payload.notes,
      recordedBy: actor.id,
    })

    if (status === PAYMENT_STATUS.SUCCESS) {
      await invoiceService.recomputePaidAmount(invoice._id)
    }

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.CREATE,
      entityType: 'Payment',
      entityId: payment._id,
      description: `Payment ${payment.paymentNumber} recorded`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, payment._id)
  }

  async updateStatus(societyId, id, payload, actor, meta = {}) {
    const payment = await paymentRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found')
    }

    const next = payload.status
    const current = payment.status

    const allowed =
      (current === PAYMENT_STATUS.PENDING &&
        [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED].includes(next)) ||
      (current === PAYMENT_STATUS.SUCCESS && next === PAYMENT_STATUS.REFUNDED)

    if (!allowed) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid payment status transition from ${current} to ${next}`,
      )
    }

    payment.status = next
    if (next === PAYMENT_STATUS.SUCCESS && !payment.paidAt) {
      payment.paidAt = new Date()
    }
    if (payload.notes !== undefined) payment.notes = payload.notes

    await payment.save()
    await invoiceService.recomputePaidAmount(payment.invoice)

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.STATUS_CHANGE,
      entityType: 'Payment',
      entityId: payment._id,
      description: `Payment ${payment.paymentNumber} status changed to ${payment.status}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.get(societyId, id)
  }

  async softDelete(societyId, id, actor, meta = {}) {
    const payment = await paymentRepository.model.findOne({
      _id: id,
      society: societyId,
      isDeleted: false,
    })
    if (!payment) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Payment not found')
    }

    if (![PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED].includes(payment.status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only PENDING or FAILED payments can be deleted')
    }

    payment.isDeleted = true
    payment.deletedAt = new Date()
    await payment.save()

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.DELETE,
      entityType: 'Payment',
      entityId: payment._id,
      description: `Payment ${payment.paymentNumber} deleted`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return { message: MESSAGES.DELETED }
  }
}

export default new PaymentService()
