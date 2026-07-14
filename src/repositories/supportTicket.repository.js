import SupportTicket from '../models/supportTicket.model.js'
import BaseRepository from './base.repository.js'

class SupportTicketRepository extends BaseRepository {
  constructor() {
    super(SupportTicket)
  }

  async search({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { isDeleted: false, ...filter }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate('createdBy', 'firstName lastName email role')
        .populate('assignedTo', 'firstName lastName email role')
        .populate('society', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(query),
    ])

    return { data, total, page, limit }
  }
}

export default new SupportTicketRepository()
