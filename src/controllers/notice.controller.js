import noticeService from '../services/notice.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class NoticeController {
  list = asyncHandler(async (req, res) => {
    const result = await noticeService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const notice = await noticeService.get(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { notice }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const notice = await noticeService.create(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { notice }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const notice = await noticeService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { notice }, MESSAGES.UPDATED))
  })

  updateStatus = asyncHandler(async (req, res) => {
    const notice = await noticeService.updateStatus(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { notice }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await noticeService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new NoticeController()
