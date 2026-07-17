import Complaint from '../models/complaint.model.js'
import BaseRepository from './base.repository.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor',
  populate: { path: 'wing', select: 'name code' },
}

class ComplaintRepository extends BaseRepository {
  constructor() {
    super(Complaint)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(flatPopulate)
        .populate('raisedByMember', 'firstName lastName phone')
        .populate('raisedByUser', 'firstName lastName email')
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
      .populate('raisedByMember', 'firstName lastName phone email')
      .populate('raisedByUser', 'firstName lastName email')
  }
}

export default new ComplaintRepository()
