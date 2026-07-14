import superAdminService from '../services/superAdmin.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class SuperAdminController {
  getDashboard = asyncHandler(async (_req, res) => {
    const data = await superAdminService.getDashboard()
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  listSocieties = asyncHandler(async (req, res) => {
    const data = await superAdminService.listSocieties(req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  getSociety = asyncHandler(async (req, res) => {
    const society = await superAdminService.getSocietyById(req.params.id)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { society }, MESSAGES.SUCCESS))
  })

  createSociety = asyncHandler(async (req, res) => {
    const society = await superAdminService.createSociety(req.body, req.user, getMeta(req))
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { society }, MESSAGES.CREATED))
  })

  updateSociety = asyncHandler(async (req, res) => {
    const society = await superAdminService.updateSociety(
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { society }, MESSAGES.UPDATED))
  })

  updateSocietyStatus = asyncHandler(async (req, res) => {
    const society = await superAdminService.updateSocietyStatus(
      req.params.id,
      req.body.status,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { society }, MESSAGES.UPDATED))
  })

  listUsers = asyncHandler(async (req, res) => {
    const data = await superAdminService.listUsers(req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  updateUserStatus = asyncHandler(async (req, res) => {
    const user = await superAdminService.updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { user }, MESSAGES.UPDATED))
  })

  listSupportTickets = asyncHandler(async (req, res) => {
    const data = await superAdminService.listSupportTickets(req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  updateSupportTicket = asyncHandler(async (req, res) => {
    const ticket = await superAdminService.updateSupportTicket(
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { ticket }, MESSAGES.UPDATED))
  })

  listActivityLogs = asyncHandler(async (req, res) => {
    const data = await superAdminService.listActivityLogs(req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })
}

export default new SuperAdminController()
