import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, MESSAGES.FORBIDDEN))
    }

    return next()
  }
}

export default authorize
