import Document from '../models/document.model.js'
import BaseRepository from './base.repository.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor',
  populate: [
    { path: 'wing', select: 'name code' },
    { path: 'floor', select: 'floorNumber name' },
  ],
}

class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate('wing', 'name code')
        .populate(flatPopulate)
        .populate('uploadedBy', 'firstName lastName email')
        .populate('uploadedForMember', 'firstName lastName phone')
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
      .populate('wing', 'name code')
      .populate(flatPopulate)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('uploadedForMember', 'firstName lastName phone')
  }
}

export default new DocumentRepository()
