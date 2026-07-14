import { validationResult } from 'express-validator'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const validate = (validations) => {
  return async (req, _res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)

    if (errors.isEmpty()) {
      return next()
    }

    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }))

    return next(
      new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, MESSAGES.VALIDATION_FAILED, formattedErrors),
    )
  }
}

export default validate
