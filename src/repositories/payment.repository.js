import Payment from '../models/payment.model.js'
import BaseRepository from './base.repository.js'
import { PAYMENT_STATUS } from '../constants/enums.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor',
  populate: [
    { path: 'wing', select: 'name code' },
    { path: 'floor', select: 'floorNumber name' },
  ],
}

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(flatPopulate)
        .populate('member', 'firstName lastName phone email')
        .populate('invoice', 'invoiceNumber totalAmount amountPaid status type')
        .populate('recordedBy', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(query),
    ])

    return { data, total, page, limit }
  }

  async findInSociety(id, societyId) {
    return this.model
      .findOne({ _id: id, society: societyId, isDeleted: false })
      .populate(flatPopulate)
      .populate('member', 'firstName lastName phone email')
      .populate('invoice', 'invoiceNumber totalAmount amountPaid status type dueDate')
      .populate('recordedBy', 'firstName lastName email')
  }

  async sumSuccessfulAmount(filter = {}) {
    const result = await this.model.aggregate([
      {
        $match: {
          ...filter,
          isDeleted: false,
          status: PAYMENT_STATUS.SUCCESS,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ])

    return result[0]?.total || 0
  }

  async sumSuccessfulForInvoice(invoiceId) {
    return this.sumSuccessfulAmount({ invoice: invoiceId })
  }
}

export default new PaymentRepository()
