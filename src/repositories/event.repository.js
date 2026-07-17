import Event from '../models/event.model.js'
import BaseRepository from './base.repository.js'

class EventRepository extends BaseRepository {
  constructor() {
    super(Event)
  }

  async search({ societyId, filter = {}, page = 1, limit = 10, sort = { startAt: 1 } } = {}) {
    const skip = (page - 1) * limit
    const query = { society: societyId, isDeleted: false, ...filter }

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('attendees.member', 'firstName lastName phone')
        .populate('attendees.user', 'firstName lastName email')
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
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees.member', 'firstName lastName phone')
      .populate('attendees.user', 'firstName lastName email')
  }
}

export default new EventRepository()
