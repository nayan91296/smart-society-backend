import { HTTP_STATUS, ROLES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Resolves society context for Society Admin/Member.
 * Super Admin may pass ?societyId= or body.societyId for tooling.
 */
const requireSocietyContext = asyncHandler(async (req, _res, next) => {
  let societyId = req.user?.society || null

  if (req.user?.role === ROLES.SUPER_ADMIN) {
    societyId = req.query.societyId || req.body?.societyId || societyId
  }

  if (!societyId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'No society assigned to this account. Contact Super Admin.',
    )
  }

  req.societyId = societyId.toString()
  next()
})

export default requireSocietyContext
