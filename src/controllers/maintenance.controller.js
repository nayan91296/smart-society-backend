import maintenanceService from '../services/maintenance.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class MaintenanceController {
  list = asyncHandler(async (req, res) => {
    const result = await maintenanceService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const maintenance = await maintenanceService.get(req.societyId, req.params.id)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { maintenance }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const maintenance = await maintenanceService.create(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { maintenance }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const maintenance = await maintenanceService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { maintenance }, MESSAGES.UPDATED))
  })

  updateStatus = asyncHandler(async (req, res) => {
    const maintenance = await maintenanceService.updateStatus(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { maintenance }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await maintenanceService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new MaintenanceController()
