import User from '../models/user.model.js'
import BaseRepository from './base.repository.js'

class UserRepository extends BaseRepository {
  constructor() {
    super(User)
  }

  async findByEmail(email, options = {}) {
    let query = this.model.findOne({ email: email.toLowerCase() })

    if (options.includePassword) {
      query = query.select('+password')
    }

    if (options.includeReset) {
      query = query.select('+passwordResetToken +passwordResetExpires')
    }

    return query
  }

  async findByIdWithPassword(id) {
    return this.model.findById(id).select('+password')
  }

  async findByResetToken(hashedToken) {
    return this.model
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      })
      .select('+password +passwordResetToken +passwordResetExpires')
  }

  async findByRole(role) {
    return this.model.find({ role })
  }
}

export default new UserRepository()
