import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { hashToken } from '../utils/token.util.js'
import refreshTokenRepository from '../repositories/refreshToken.repository.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const parseExpiryToMs = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(expiry)

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000
  }

  const value = Number(match[1])
  const unit = match[2]

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return value * multipliers[unit]
}

class TokenService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      env.jwt.accessSecret,
      { expiresIn: env.jwt.accessExpiresIn },
    )
  }

  generateRefreshToken(user, rememberMe = false) {
    const expiresIn = rememberMe ? env.jwt.rememberMeExpiresIn : env.jwt.refreshExpiresIn

    return jwt.sign(
      {
        sub: user._id.toString(),
        type: 'refresh',
      },
      env.jwt.refreshSecret,
      { expiresIn },
    )
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.jwt.accessSecret)
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_TOKEN)
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, env.jwt.refreshSecret)
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN)
    }
  }

  async storeRefreshToken(userId, refreshToken, meta = {}) {
    const decoded = jwt.decode(refreshToken)
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + parseExpiryToMs(env.jwt.refreshExpiresIn))

    return refreshTokenRepository.create({
      user: userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      createdByIp: meta.ip,
      userAgent: meta.userAgent,
    })
  }

  async validateStoredRefreshToken(refreshToken) {
    const tokenHash = hashToken(refreshToken)
    const stored = await refreshTokenRepository.findValidToken(tokenHash)

    if (!stored) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN)
    }

    return stored
  }

  async revokeRefreshToken(refreshToken) {
    const tokenHash = hashToken(refreshToken)
    return refreshTokenRepository.revokeToken(tokenHash)
  }

  async revokeAllUserTokens(userId) {
    return refreshTokenRepository.revokeAllForUser(userId)
  }

  getRefreshCookieOptions(rememberMe = false) {
    const maxAge = parseExpiryToMs(
      rememberMe ? env.jwt.rememberMeExpiresIn : env.jwt.refreshExpiresIn,
    )

    return {
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? 'strict' : 'lax',
      domain: env.cookieDomain === 'localhost' ? undefined : env.cookieDomain,
      path: '/',
      maxAge,
    }
  }
}

export default new TokenService()
