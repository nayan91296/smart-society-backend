import societyService from '../services/society.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class SocietyController {
  getProfile = asyncHandler(async (req, res) => {
    const society = await societyService.getProfile(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { society }, MESSAGES.SUCCESS))
  })

  updateProfile = asyncHandler(async (req, res) => {
    const society = await societyService.updateProfile(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { society }, MESSAGES.UPDATED))
  })

  getOverview = asyncHandler(async (req, res) => {
    const overview = await societyService.getOverview(req.societyId)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { overview }, MESSAGES.SUCCESS))
  })

  getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await societyService.getDashboard(req.societyId)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { dashboard }, MESSAGES.SUCCESS))
  })

  listWings = asyncHandler(async (req, res) => {
    const wings = await societyService.listWings(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { wings }, MESSAGES.SUCCESS))
  })

  getWing = asyncHandler(async (req, res) => {
    const wing = await societyService.getWing(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { wing }, MESSAGES.SUCCESS))
  })

  createWing = asyncHandler(async (req, res) => {
    const wing = await societyService.createWing(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { wing }, MESSAGES.CREATED))
  })

  updateWing = asyncHandler(async (req, res) => {
    const wing = await societyService.updateWing(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { wing }, MESSAGES.UPDATED))
  })

  deleteWing = asyncHandler(async (req, res) => {
    const result = await societyService.deleteWing(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  listFloors = asyncHandler(async (req, res) => {
    const floors = await societyService.listFloors(req.societyId, req.params.wingId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { floors }, MESSAGES.SUCCESS))
  })

  listAllFloors = asyncHandler(async (req, res) => {
    const floors = await societyService.listAllFloors(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { floors }, MESSAGES.SUCCESS))
  })

  getFloor = asyncHandler(async (req, res) => {
    const floor = await societyService.getFloor(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { floor }, MESSAGES.SUCCESS))
  })

  createFloor = asyncHandler(async (req, res) => {
    const floor = await societyService.createFloor(
      req.societyId,
      req.params.wingId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { floor }, MESSAGES.CREATED))
  })

  bulkCreateFloors = asyncHandler(async (req, res) => {
    const result = await societyService.bulkCreateFloors(
      req.societyId,
      req.params.wingId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, result, MESSAGES.CREATED))
  })

  updateFloor = asyncHandler(async (req, res) => {
    const floor = await societyService.updateFloor(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { floor }, MESSAGES.UPDATED))
  })

  deleteFloor = asyncHandler(async (req, res) => {
    const result = await societyService.deleteFloor(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  listFlats = asyncHandler(async (req, res) => {
    const data = await societyService.listFlats(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  getFlat = asyncHandler(async (req, res) => {
    const flat = await societyService.getFlat(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { flat }, MESSAGES.SUCCESS))
  })

  createFlat = asyncHandler(async (req, res) => {
    const flat = await societyService.createFlat(req.societyId, req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { flat }, MESSAGES.CREATED))
  })

  updateFlat = asyncHandler(async (req, res) => {
    const flat = await societyService.updateFlat(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { flat }, MESSAGES.UPDATED))
  })

  deleteFlat = asyncHandler(async (req, res) => {
    const result = await societyService.deleteFlat(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new SocietyController()
