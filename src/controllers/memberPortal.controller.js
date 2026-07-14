import memberPortalService from '../services/memberPortal.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class MemberPortalController {
  getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await memberPortalService.getDashboard(req.member)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { dashboard }, MESSAGES.SUCCESS))
  })

  listVisitors = asyncHandler(async (req, res) => {
    const result = await memberPortalService.listVisitors(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  createVisitor = asyncHandler(async (req, res) => {
    const visitor = await memberPortalService.createVisitor(
      req.member,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { visitor }, MESSAGES.CREATED))
  })

  cancelVisitor = asyncHandler(async (req, res) => {
    const visitor = await memberPortalService.cancelVisitor(
      req.member,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { visitor }, MESSAGES.UPDATED))
  })

  listComplaints = asyncHandler(async (req, res) => {
    const result = await memberPortalService.listComplaints(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getComplaint = asyncHandler(async (req, res) => {
    const complaint = await memberPortalService.getComplaint(req.member, req.params.id)
    res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { complaint }, MESSAGES.SUCCESS))
  })

  createComplaint = asyncHandler(async (req, res) => {
    const complaint = await memberPortalService.createComplaint(
      req.member,
      req.body,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { complaint }, MESSAGES.CREATED))
  })
}

export default new MemberPortalController()
