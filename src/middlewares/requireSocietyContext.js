import societyRepository from '../repositories/society.repository.js'
import { HTTP_STATUS, MESSAGES, ROLES, SOCIETY_STATUS } from '../constants/index.js'
import { isValidObjectId } from '../utils/objectId.util.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Resolves tenant society context.
 * - SOCIETY_ADMIN / WING_SECRETARY / MEMBER: always their assigned society (header/query ignored).
 * - SUPER_ADMIN: X-Society-Id (preferred), then ?societyId=, then persisted activeSocietyContext.
 * Body.societyId is never used for context.
 * Society must exist, not be deleted, and be ACTIVE for tenant operations.
 */
const requireSocietyContext = asyncHandler(async (req, _res, next) => {
  let societyId

  if (req.user?.role === ROLES.SUPER_ADMIN) {
    const headerId = req.get('x-society-id')
    const queryId = typeof req.query.societyId === 'string' ? req.query.societyId : null
    societyId = headerId || queryId || req.user.activeSocietyContext || null

    if (!societyId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Society context required. Set X-Society-Id or select a society via /super-admin/context.',
      )
    }
  } else {
    societyId = req.user?.society || null

    if (!societyId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'No society assigned to this account. Contact Super Admin.',
      )
    }
  }

  if (!isValidObjectId(societyId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid society id')
  }

  const society = await societyRepository.findByIdNotDeleted(societyId)
  if (!society) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Society not found')
  }

  if (society.status !== SOCIETY_STATUS.ACTIVE) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.SOCIETY_NOT_ACTIVE)
  }

  req.societyId = society._id.toString()
  req.society = {
    id: society._id.toString(),
    name: society.name,
    code: society.code,
    status: society.status,
  }
  next()
})

export default requireSocietyContext
