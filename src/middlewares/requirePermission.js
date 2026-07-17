import { HTTP_STATUS, MESSAGES, hasPermission } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import roleService from '../services/role.service.js'

/**
 * Ensures the authenticated user has the given permission (effective, with society overrides).
 * Preserves existing role guards — use alongside authorize(...) as needed.
 */
const requirePermission = (...requiredPermissions) => {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED)
    }

    if (!req.effectivePermissions) {
      const result = await roleService.getEffectivePermissions(req.user, req.societyId)
      req.effectivePermissions = result.permissions
    }

    const missing = requiredPermissions.filter(
      (p) => !hasPermission(req.effectivePermissions, p),
    )

    if (missing.length) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.FORBIDDEN)
    }

    next()
  })
}

/**
 * Attaches effective permissions to the request without enforcing.
 */
const attachPermissions = asyncHandler(async (req, _res, next) => {
  if (req.user && !req.effectivePermissions) {
    const result = await roleService.getEffectivePermissions(req.user, req.societyId)
    req.effectivePermissions = result.permissions
  }
  next()
})

export { requirePermission, attachPermissions }
export default requirePermission
