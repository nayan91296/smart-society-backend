import invoiceService from '../services/invoice.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class InvoiceController {
  list = asyncHandler(async (req, res) => {
    const result = await invoiceService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.get(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { invoice }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.create(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { invoice }, MESSAGES.CREATED))
  })

  bulkCreate = asyncHandler(async (req, res) => {
    const result = await invoiceService.bulkCreate(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, result, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { invoice }, MESSAGES.UPDATED))
  })

  updateStatus = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.updateStatus(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { invoice }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await invoiceService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new InvoiceController()
