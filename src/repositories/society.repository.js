import Society from '../models/society.model.js'
import BaseRepository from './base.repository.js'

class SocietyRepository extends BaseRepository {
  constructor() {
    super(Society)
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase(), isDeleted: false })
  }

  async findActiveById(id) {
    return this.model.findOne({ _id: id, isDeleted: false })
  }

  async search({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { isDeleted: false, ...filter }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate('admin', 'firstName lastName email phone role isActive')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(query),
    ])

    return { data, total, page, limit }
  }
}

export default new SocietyRepository()
