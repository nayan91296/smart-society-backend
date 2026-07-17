import Wing from '../models/wing.model.js'
import BaseRepository from './base.repository.js'

class WingRepository extends BaseRepository {
  constructor() {
    super(Wing)
  }

  async findBySociety(societyId, filter = {}) {
    return this.model
      .find({ ...filter, society: societyId, isDeleted: false })
      .sort({ name: 1 })
  }

  async searchBySociety(societyId, { search, isActive } = {}) {
    const filter = { society: societyId, isDeleted: false }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }]
    }

    return this.model.find(filter).sort({ name: 1 })
  }

  async findInSociety(id, societyId) {
    return this.model.findOne({ _id: id, society: societyId, isDeleted: false })
  }

  async findByCode(societyId, code) {
    return this.model.findOne({
      society: societyId,
      code: code.toUpperCase(),
      isDeleted: false,
    })
  }
}

export default new WingRepository()
