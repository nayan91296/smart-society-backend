import Member from '../models/member.model.js'
import BaseRepository from './base.repository.js'

const flatPopulate = {
  path: 'flat',
  select: 'flatNumber wing floor status type',
  populate: [
    { path: 'wing', select: 'name code' },
    { path: 'floor', select: 'floorNumber name' },
  ],
}

class MemberRepository extends BaseRepository {
  constructor() {
    super(Member)
  }

  async countActive(filter = {}) {
    return this.model.countDocuments({ ...filter, isDeleted: false, isActive: true })
  }

  async findByFlat(flatId, { societyId, activeOnly = true, limit } = {}) {
    const query = { flat: flatId, isDeleted: false }
    if (societyId) query.society = societyId
    if (activeOnly) query.isActive = true

    let q = this.model.find(query).sort({ isPrimary: -1, createdAt: 1 })
    if (limit) q = q.limit(limit)
    return q
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate(flatPopulate)
        .populate('user', 'firstName lastName email phone role isActive')
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
      .populate('user', 'firstName lastName email phone role isActive')
  }

  async findByUserAndSociety(userId, societyId) {
    return this.model
      .findOne({
        user: userId,
        society: societyId,
        isDeleted: false,
        isActive: true,
      })
      .populate(flatPopulate)
  }

  async unsetPrimaryOnFlat(flatId, { societyId, exceptId = null } = {}) {
    const filter = { flat: flatId, isPrimary: true, isDeleted: false }
    if (societyId) filter.society = societyId
    if (exceptId) filter._id = { $ne: exceptId }
    return this.model.updateMany(filter, { $set: { isPrimary: false } })
  }
}

export default new MemberRepository()
