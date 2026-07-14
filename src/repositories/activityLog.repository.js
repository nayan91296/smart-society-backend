import ActivityLog from '../models/activityLog.model.js'
import BaseRepository from './base.repository.js'

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super(ActivityLog)
  }

  async search({ filter = {}, page = 1, limit = 20, sort = { createdAt: -1 } } = {}) {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('user', 'firstName lastName email role')
        .populate('society', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      this.model.countDocuments(filter),
    ])

    return { data, total, page, limit }
  }

  async log({
    society = null,
    user = null,
    action,
    entityType,
    entityId = null,
    description = '',
    metadata = {},
    ip,
    userAgent,
  }) {
    return this.create({
      society,
      user,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ip,
      userAgent,
    })
  }
}

export default new ActivityLogRepository()
