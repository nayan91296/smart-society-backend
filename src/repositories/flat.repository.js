import Flat from '../models/flat.model.js'
import BaseRepository from './base.repository.js'

class FlatRepository extends BaseRepository {
  constructor() {
    super(Flat)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { flatNumber: 1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, society: societyId, isDeleted: false }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate('wing', 'name code')
        .populate('floor', 'floorNumber name')
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
      .populate('floor', 'floorNumber name')
  }

  async findByNumber(societyId, wingId, flatNumber) {
    return this.model.findOne({
      society: societyId,
      wing: wingId,
      flatNumber: flatNumber.toUpperCase(),
      isDeleted: false,
    })
  }
}

export default new FlatRepository()
