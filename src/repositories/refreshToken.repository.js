import RefreshToken from '../models/refreshToken.model.js'
import BaseRepository from './base.repository.js'

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken)
  }

  async findValidToken(tokenHash) {
    return this.model.findOne({
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
  }

  async revokeToken(tokenHash) {
    return this.model.findOneAndUpdate(
      { tokenHash },
      { isRevoked: true, revokedAt: new Date() },
      { new: true },
    )
  }

  async revokeAllForUser(userId) {
    return this.model.updateMany(
      { user: userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    )
  }
}

export default new RefreshTokenRepository()
