import Invoice from '../models/invoice.model.js'
import BaseRepository from './base.repository.js'
import { INVOICE_STATUS } from '../constants/enums.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor',
  populate: [
    { path: 'wing', select: 'name code' },
    { path: 'floor', select: 'floorNumber name' },
  ],
}

class InvoiceRepository extends BaseRepository {
  constructor() {
    super(Invoice)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(flatPopulate)
        .populate('member', 'firstName lastName phone email')
        .populate('createdBy', 'firstName lastName email')
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
      .populate('createdBy', 'firstName lastName email')
  }

  async findDuplicatePeriod({ societyId, flatId, type, periodStart, periodEnd, excludeId } = {}) {
    const filter = {
      society: societyId,
      flat: flatId,
      type,
      periodStart,
      periodEnd,
      isDeleted: false,
      status: { $ne: INVOICE_STATUS.CANCELLED },
    }
    if (excludeId) filter._id = { $ne: excludeId }
    return this.model.findOne(filter)
  }
}

export default new InvoiceRepository()
