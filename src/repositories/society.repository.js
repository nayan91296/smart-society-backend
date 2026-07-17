import Society from '../models/society.model.js'
import { SOCIETY_STATUS } from '../constants/enums.js'
import BaseRepository from './base.repository.js'

class SocietyRepository extends BaseRepository {
  constructor() {
    super(Society)
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase(), isDeleted: false })
  }

  /** Society exists and is not soft-deleted (any status). */
  async findByIdNotDeleted(id) {
    return this.model.findOne({ _id: id, isDeleted: false })
  }

  /** @deprecated Prefer findByIdNotDeleted — name is misleading (does not filter status). */
  async findActiveById(id) {
    return this.findByIdNotDeleted(id)
  }

  /** Society usable for tenant operations (ACTIVE + not deleted). */
  async findOperationalById(id) {
    return this.model.findOne({
      _id: id,
      isDeleted: false,
      status: SOCIETY_STATUS.ACTIVE,
    })
  }

  async search({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { ...filter, isDeleted: false }

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
