import flatRepository from '../repositories/flat.repository.js'
import { HTTP_STATUS } from '../constants/httpStatus.js'
import ApiError from '../utils/ApiError.js'

export const getRefId = (ref) => {
  if (!ref) return null
  if (typeof ref === 'string') return ref
  return ref._id?.toString?.() || ref.id?.toString?.() || null
}

/** Force list/query filters to the server-derived wing when scoped. */
export const mergeWingScope = (query = {}, wingId = null) => {
  if (!wingId) return { ...query }
  return { ...query, wingId: String(wingId) }
}

export const assertFlatInWing = async (flatId, societyId, wingId) => {
  if (!wingId) return null

  if (!flatId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Society-wide (null-flat) records are managed by Society Admin only',
    )
  }

  const flat = await flatRepository.findInSociety(flatId, societyId)
  if (!flat) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Flat not found in this society')
  }

  if (getRefId(flat.wing) !== String(wingId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Resource is outside your managed wing')
  }

  return flat
}

export const assertOptionalFlatInWing = async (flatId, societyId, wingId) => {
  if (!wingId) return null
  return assertFlatInWing(flatId, societyId, wingId)
}

export const getWingFlatIds = async (societyId, wingId) => {
  const flats = await flatRepository.find({
    society: societyId,
    wing: wingId,
    isDeleted: false,
  })
  return flats.map((f) => f._id)
}

export const applyWingFlatFilter = async (filter, societyId, wingId, flatId = null) => {
  if (!wingId) {
    if (flatId) filter.flat = flatId
    return filter
  }

  const flats = await flatRepository.find({
    society: societyId,
    wing: wingId,
    isDeleted: false,
  })
  const flatIds = flats.map((f) => f._id)

  if (flatId) {
    const match = flats.some((f) => f._id.toString() === String(flatId))
    filter.flat = match ? flatId : { $in: [] }
  } else {
    filter.flat = { $in: flatIds }
  }

  return filter
}
