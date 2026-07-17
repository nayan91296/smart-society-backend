import notificationService from '../services/notification.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class NotificationController {
  listMine = asyncHandler(async (req, res) => {
    const result = await notificationService.listMine(req.user.id, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  unreadCount = asyncHandler(async (req, res) => {
    const result = await notificationService.unreadCount(req.user.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getMine = asyncHandler(async (req, res) => {
    const notification = await notificationService.getMine(req.user.id, req.params.id)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { notification }, MESSAGES.SUCCESS))
  })

  markRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.user.id, req.params.id)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { notification }, MESSAGES.UPDATED))
  })

  markAllRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllRead(req.user.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, result.message))
  })

  send = asyncHandler(async (req, res) => {
    const result = await notificationService.send(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, result, MESSAGES.CREATED))
  })

  broadcast = asyncHandler(async (req, res) => {
    const result = await notificationService.broadcast(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, result, MESSAGES.CREATED))
  })

  providers = asyncHandler(async (req, res) => {
    const result = notificationService.getProviderStatus()
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })
}

export default new NotificationController()
