import memberRepository from '../repositories/member.repository.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import requireSocietyContext from './requireSocietyContext.js'

/**
 * Ensures the authenticated MEMBER has an active Member profile in the society.
 * Depends on authenticate + authorize(MEMBER) + requireSocietyContext.
 */
const requireMemberProfile = [
  requireSocietyContext,
  asyncHandler(async (req, _res, next) => {
    const member = await memberRepository.findByUserAndSociety(req.user.id, req.societyId)

    if (!member) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'No active member profile found for this account in the society',
      )
    }

    req.member = {
      id: member._id.toString(),
      society: member.society?.toString?.() || member.society,
      flat: member.flat?._id?.toString?.() || member.flat?.toString?.() || member.flat,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      ownershipType: member.ownershipType,
      isPrimary: member.isPrimary,
      isActive: member.isActive,
      doc: member,
    }

    next()
  }),
]

export default requireMemberProfile
