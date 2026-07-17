import paymentService from '../services/payment.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class PaymentController {
  list = asyncHandler(async (req, res) => {
    const result = await paymentService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const payment = await paymentService.get(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { payment }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const payment = await paymentService.create(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { payment }, MESSAGES.CREATED))
  })

  updateStatus = asyncHandler(async (req, res) => {
    const payment = await paymentService.updateStatus(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { payment }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await paymentService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new PaymentController()
