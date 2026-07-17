import { ROLES } from '../constants/roles.js'
import { HTTP_STATUS } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Wing scope enforcement for WING_SECRETARY.
 * - Forces req.wingId from the user's managedWing (client wingId/header overrides ignored).
 * - No-op for SOCIETY_ADMIN / SUPER_ADMIN (and any other non-secretary roles).
 */
const requireWingScope = asyncHandler(async (req, _res, next) => {
  if (req.user?.role !== ROLES.WING_SECRETARY) {
    return next()
  }

  const managedWing = req.user.managedWing
  if (!managedWing) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Wing Secretary account has no managed wing assigned',
    )
  }

  req.wingId = String(managedWing)
  // Strip client-supplied wing overrides so services never trust them.
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, 'wingId')) {
    delete req.query.wingId
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'wingId')) {
    delete req.body.wingId
  }

  return next()
})

export default requireWingScope
