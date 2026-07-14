import env from '../config/env.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const errorHandler = (err, _req, res, _next) => {
  let error = err

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    const message = error.message || MESSAGES.INTERNAL_ERROR
    error = new ApiError(statusCode, message, error.errors ?? [], error.stack)
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(env.isDev && { stack: error.stack }),
  }

  return res.status(error.statusCode).json(response)
}

export default errorHandler
