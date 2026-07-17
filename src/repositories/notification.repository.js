import Notification from '../models/notification.model.js'
import BaseRepository from './base.repository.js'

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification)
  }

  async searchForUser({
    userId,
    filter = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
  } = {}) {
    const skip = (page - 1) * limit
    const query = { user: userId, ...filter }

    const [data, total] = await Promise.all([
      this.model.find(query).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(query),
    ])

    return { data, total, page, limit }
  }

  async countUnread(userId) {
    return this.model.countDocuments({ user: userId, isRead: false })
  }

  async markRead(userId, id) {
    return this.model.findOneAndUpdate(
      { _id: id, user: userId, isRead: false },
      { isRead: true, readAt: new Date() },
      { new: true },
    )
  }

  async markAllRead(userId) {
    return this.model.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    )
  }

  async findForUser(userId, id) {
    return this.model.findOne({ _id: id, user: userId })
  }
}

export default new NotificationRepository()
