import memberPortalService from '../services/memberPortal.service.js'
import invoiceService from '../services/invoice.service.js'
import paymentService from '../services/payment.service.js'
import noticeService from '../services/notice.service.js'
import eventService from '../services/event.service.js'
import documentService from '../services/document.service.js'
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

  listInvoices = asyncHandler(async (req, res) => {
    const result = await invoiceService.listForMember(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getInvoice = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getForMember(req.member, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { invoice }, MESSAGES.SUCCESS))
  })

  listPayments = asyncHandler(async (req, res) => {
    const result = await paymentService.listForMember(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.getForMember(req.member, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { payment }, MESSAGES.SUCCESS))
  })

  listNotices = asyncHandler(async (req, res) => {
    const result = await noticeService.listForMember(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getNotice = asyncHandler(async (req, res) => {
    const notice = await noticeService.getForMember(req.member, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { notice }, MESSAGES.SUCCESS))
  })

  listEvents = asyncHandler(async (req, res) => {
    const result = await eventService.listForMember(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getEvent = asyncHandler(async (req, res) => {
    const event = await eventService.getForMember(req.member, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { event }, MESSAGES.SUCCESS))
  })

  rsvpEvent = asyncHandler(async (req, res) => {
    const event = await eventService.rsvp(req.member, req.params.id, req.user, getMeta(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { event }, MESSAGES.UPDATED))
  })

  cancelRsvp = asyncHandler(async (req, res) => {
    const event = await eventService.cancelRsvp(req.member, req.params.id, req.user, getMeta(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { event }, MESSAGES.UPDATED))
  })

  listDocuments = asyncHandler(async (req, res) => {
    const result = await documentService.listForMember(req.member, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getDocument = asyncHandler(async (req, res) => {
    const document = await documentService.getForMember(req.member, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { document }, MESSAGES.SUCCESS))
  })
}

export default new MemberPortalController()
