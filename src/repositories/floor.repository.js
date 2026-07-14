import Floor from '../models/floor.model.js'
import BaseRepository from './base.repository.js'

class FloorRepository extends BaseRepository {
  constructor() {
    super(Floor)
  }

  async findByWing(wingId, societyId) {
    return this.model
      .find({ wing: wingId, society: societyId, isDeleted: false })
      .sort({ floorNumber: 1 })
  }

  async searchBySociety(societyId, { search, wingId, isActive } = {}) {
    const filter = { society: societyId, isDeleted: false }

    if (wingId) {
      filter.wing = wingId
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const or = [{ name: regex }]
      const asNumber = Number(search)
      if (!Number.isNaN(asNumber) && String(asNumber) === String(search).trim()) {
        or.push({ floorNumber: asNumber })
      }
      filter.$or = or
    }

    return this.model
      .find(filter)
      .populate('wing', 'name code')
      .sort({ wing: 1, floorNumber: 1 })
  }

  async findInSociety(id, societyId) {
    return this.model
      .findOne({ _id: id, society: societyId, isDeleted: false })
      .populate('wing', 'name code')
  }

  async findByNumber(wingId, floorNumber) {
    return this.model.findOne({
      wing: wingId,
      floorNumber,
      isDeleted: false,
    })
  }
}

export default new FloorRepository()
