import { MESSAGES } from '../constants/index.js'
import { HTTP_STATUS } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const notFound = (req, _res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `${MESSAGES.ROUTE_NOT_FOUND}: ${req.originalUrl}`))
}

export default notFound
