import visitorService from '../services/visitor.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class VisitorController {
  list = asyncHandler(async (req, res) => {
    const result = await visitorService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const visitor = await visitorService.get(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { visitor }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const visitor = await visitorService.create(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { visitor }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const visitor = await visitorService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { visitor }, MESSAGES.UPDATED))
  })

  updateStatus = asyncHandler(async (req, res) => {
    const visitor = await visitorService.updateStatus(
      req.societyId,
      req.params.id,
      req.body.status,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { visitor }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await visitorService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new VisitorController()
