import reportService from '../services/report.service.js'
import { HTTP_STATUS, MESSAGES, ROLES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'
import { mergeWingScope } from '../helpers/wingScope.helper.js'
import ApiError from '../utils/ApiError.js'

const ADMIN_ONLY_REPORTS = new Set(['billing', 'parking'])

class ReportController {
  #scopedQuery(req) {
    return mergeWingScope(req.query, req.wingId)
  }

  #assertSecretaryExportAllowed(req, type) {
    if (req.user?.role === ROLES.WING_SECRETARY && ADMIN_ONLY_REPORTS.has(type)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Report type is not available for Wing Secretary')
    }
  }

  dashboard = asyncHandler(async (req, res) => {
    const report = await reportService.getDashboard(req.societyId, this.#scopedQuery(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  occupancy = asyncHandler(async (req, res) => {
    const report = await reportService.getOccupancy(req.societyId, this.#scopedQuery(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  billing = asyncHandler(async (req, res) => {
    const report = await reportService.getBilling(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  complaints = asyncHandler(async (req, res) => {
    const report = await reportService.getComplaints(req.societyId, this.#scopedQuery(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  visitors = asyncHandler(async (req, res) => {
    const report = await reportService.getVisitors(req.societyId, this.#scopedQuery(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  maintenance = asyncHandler(async (req, res) => {
    const report = await reportService.getMaintenance(req.societyId, this.#scopedQuery(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  parking = asyncHandler(async (req, res) => {
    const report = await reportService.getParking(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { report }, MESSAGES.SUCCESS))
  })

  export = asyncHandler(async (req, res) => {
    const type = (req.query.type || 'dashboard').toLowerCase()
    this.#assertSecretaryExportAllowed(req, type)
    const result = await reportService.exportReport(req.societyId, this.#scopedQuery(req))

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
