import tokenService from '../services/token.service.js'
import userRepository from '../repositories/user.repository.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED)
  }

  const payload = tokenService.verifyAccessToken(token)
  const user = await userRepository.findById(payload.sub)

  if (!user || !user.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED)
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    society: user.society ? user.society.toString() : null,
  }

  next()
})

export default authenticate
