import parkingService from '../services/parking.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class ParkingController {
  list = asyncHandler(async (req, res) => {
    const result = await parkingService.listParking(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const parking = await parkingService.getParking(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { parking }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const parking = await parkingService.createParking(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { parking }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const parking = await parkingService.updateParking(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { parking }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await parkingService.softDeleteParking(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  assign = asyncHandler(async (req, res) => {
    const parking = await parkingService.assignVehicle(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { parking }, MESSAGES.UPDATED))
  })

  unassign = asyncHandler(async (req, res) => {
    const parking = await parkingService.unassignVehicle(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { parking }, MESSAGES.UPDATED))
  })

  listVehicles = asyncHandler(async (req, res) => {
    const result = await parkingService.listVehicles(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getVehicle = asyncHandler(async (req, res) => {
    const vehicle = await parkingService.getVehicle(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { vehicle }, MESSAGES.SUCCESS))
  })

  createVehicle = asyncHandler(async (req, res) => {
    const vehicle = await parkingService.createVehicle(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { vehicle }, MESSAGES.CREATED))
  })

  updateVehicle = asyncHandler(async (req, res) => {
    const vehicle = await parkingService.updateVehicle(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { vehicle }, MESSAGES.UPDATED))
  })

  softDeleteVehicle = asyncHandler(async (req, res) => {
    const result = await parkingService.softDeleteVehicle(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  // Member portal
  listMyVehicles = asyncHandler(async (req, res) => {
    const result = await parkingService.listMemberVehicles(req.societyId, req.member)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  createMyVehicle = asyncHandler(async (req, res) => {
    const vehicle = await parkingService.createMemberVehicle(
      req.societyId,
      req.member,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { vehicle }, MESSAGES.CREATED))
  })

  updateMyVehicle = asyncHandler(async (req, res) => {
    const vehicle = await parkingService.updateMemberVehicle(
      req.societyId,
      req.member,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { vehicle }, MESSAGES.UPDATED))
  })

  deleteMyVehicle = asyncHandler(async (req, res) => {
    const result = await parkingService.deleteMemberVehicle(
      req.societyId,
      req.member,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  getMyParking = asyncHandler(async (req, res) => {
    const result = await parkingService.getMemberParking(req.societyId, req.member)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })
}

export default new ParkingController()
