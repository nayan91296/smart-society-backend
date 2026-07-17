import reportService from '../services/report.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

class ReportController {
  dashboard = asyncHandler(async (req, res) => {
    const report = await reportService.getDashboard(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  occupancy = asyncHandler(async (req, res) => {
    const report = await reportService.getOccupancy(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  billing = asyncHandler(async (req, res) => {
    const report = await reportService.getBilling(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  complaints = asyncHandler(async (req, res) => {
    const report = await reportService.getComplaints(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  visitors = asyncHandler(async (req, res) => {
    const report = await reportService.getVisitors(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  maintenance = asyncHandler(async (req, res) => {
    const report = await reportService.getMaintenance(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  parking = asyncHandler(async (req, res) => {
    const report = await reportService.getParking(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  export = asyncHandler(async (req, res) => {
    const result = await reportService.exportReport(req.societyId, req.query)

    if (result.format === 'csv') {
      res.setHeader('Content-Type', result.contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      return res.status(HTTP_STATUS.OK).send(result.body)
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(new ApiResponse(HTTP_STATUS.OK, { report: result.body }, MESSAGES.SUCCESS))
  })
}

export default new ReportController()
