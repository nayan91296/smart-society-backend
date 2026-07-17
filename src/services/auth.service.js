import env from '../config/env.js'
import userRepository from '../repositories/user.repository.js'
import societyRepository from '../repositories/society.repository.js'
import tokenService from './token.service.js'
import emailService from './email.service.js'
import roleService from './role.service.js'
import { generatePasswordResetToken, hashToken } from '../utils/token.util.js'
import { HTTP_STATUS, MESSAGES, PREFERRED_LANGUAGE, ROLES, SOCIETY_STATUS } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const parseExpiryToMs = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(expiry)

  if (!match) {
    return 60 * 60 * 1000
  }

  const value = Number(match[1])
  const unit = match[2]
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
  return value * multipliers[unit]
}

const sanitizeUser = async (user) => {
  const userObj = user.toJSON ? user.toJSON() : user
  const societyId = userObj.society?._id?.toString?.() || userObj.society?.toString?.() || userObj.society
  let permissions = []
  try {
    const result = await roleService.getEffectivePermissions(
      { id: userObj._id?.toString?.() || userObj.id, role: userObj.role },
      societyId,
    )
    permissions = Array.isArray(result?.permissions) ? result.permissions : []
  } catch {
    // Fall back to empty; frontend role catalog still applies
  }

  const managedWing =
    userObj.managedWing?._id?.toString?.() ||
    userObj.managedWing?.toString?.() ||
    userObj.managedWing ||
    null

  return {
    id: userObj._id?.toString?.() || userObj.id,
    firstName: userObj.firstName,
    lastName: userObj.lastName,
    email: userObj.email,
    phone: userObj.phone ?? null,
    role: userObj.role,
    society: userObj.society ?? null,
    activeSocietyContext: userObj.activeSocietyContext ?? null,
    managedWing,
    preferredLanguage: userObj.preferredLanguage || PREFERRED_LANGUAGE.EN,
    isActive: userObj.isActive,
    permissions,
    lastLogin: userObj.lastLogin,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
  }
}

/** Blocks non-SUPER_ADMIN users when their society is not ACTIVE. */
const assertTenantSocietyAllowsAccess = async (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return

  if (!user.society) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'No society assigned to this account. Contact Super Admin.',
    )
  }

  const society = await societyRepository.findByIdNotDeleted(user.society)
  if (!society) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Assigned society was not found')
  }

  if (society.status !== SOCIETY_STATUS.ACTIVE) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.SOCIETY_NOT_ACTIVE)
  }
}

class AuthService {
  async registerSocietyAdmin({ firstName, lastName, email, password, preferredLanguage }) {
    const existing = await userRepository.findByEmail(email)

    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, MESSAGES.EMAIL_ALREADY_EXISTS)
    }

    const user = await userRepository.create({
      firstName,
      lastName,
      email,
      password,
      role: ROLES.SOCIETY_ADMIN,
      ...(preferredLanguage !== undefined && { preferredLanguage }),
    })

    return await sanitizeUser(user)
  }

  async login({ email, password, rememberMe = false }, meta = {}) {
    const user = await userRepository.findByEmail(email, { includePassword: true })

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_CREDENTIALS)
    }

    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.ACCOUNT_DISABLED)
    }

    await assertTenantSocietyAllowsAccess(user)

    const accessToken = tokenService.generateAccessToken(user)
    const refreshToken = tokenService.generateRefreshToken(user, rememberMe)

    await tokenService.storeRefreshToken(user._id, refreshToken, meta)

    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    return {
      user: await sanitizeUser(user),
      accessToken,
      refreshToken,
      rememberMe,
    }
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken)
    }
  }

  async refreshTokens(refreshToken, meta = {}) {
    if (!refreshToken) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN)
    }

    const payload = tokenService.verifyRefreshToken(refreshToken)
    const stored = await tokenService.validateStoredRefreshToken(refreshToken)

    if (stored.user.toString() !== payload.sub) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.INVALID_REFRESH_TOKEN)
    }

    const user = await userRepository.findById(payload.sub)

    if (!user || !user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED)
    }

    await assertTenantSocietyAllowsAccess(user)

    await tokenService.revokeRefreshToken(refreshToken)

    const newAccessToken = tokenService.generateAccessToken(user)
    const newRefreshToken = tokenService.generateRefreshToken(user, false)

    await tokenService.storeRefreshToken(user._id, newRefreshToken, meta)

    return {
      user: await sanitizeUser(user),
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  async getMe(userId) {
    const user = await userRepository.findById(userId)

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    return await sanitizeUser(user)
  }

  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email)

    if (!user) {
      return { message: MESSAGES.PASSWORD_RESET_SENT }
    }

    const { resetToken, hashedToken } = generatePasswordResetToken()

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = new Date(Date.now() + parseExpiryToMs(env.passwordResetExpiresIn))
    await user.save({ validateBeforeSave: false })

    await emailService.sendPasswordResetEmail(user, resetToken)

    return {
      message: MESSAGES.PASSWORD_RESET_SENT,
      ...(env.isDev && { resetToken }),
    }
  }

  async resetPassword(token, newPassword) {
    const hashedToken = hashToken(token)
    const user = await userRepository.findByResetToken(hashedToken)

    if (!user) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.INVALID_TOKEN)
    }

    user.password = newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    await tokenService.revokeAllUserTokens(user._id)

    return { message: MESSAGES.PASSWORD_RESET_SUCCESS }
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId)

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND)
    }

    const isMatch = await user.comparePassword(currentPassword)

    if (!isMatch) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.CURRENT_PASSWORD_INCORRECT)
    }

    if (currentPassword === newPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, MESSAGES.PASSWORD_SAME)
    }

    user.password = newPassword
    await user.save()

    await tokenService.revokeAllUserTokens(user._id)

    return { message: MESSAGES.PASSWORD_CHANGED }
  }

  async logoutAllSessions(userId) {
    await tokenService.revokeAllUserTokens(userId)
    return { message: 'All sessions revoked successfully' }
  }
}

export default new AuthService()
