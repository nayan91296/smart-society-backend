import documentService from '../services/document.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class DocumentController {
  list = asyncHandler(async (req, res) => {
    const result = await documentService.list(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const document = await documentService.get(req.societyId, req.params.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { document }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const document = await documentService.create(
      req.societyId,
      req.body,
      req.file,
      req.user,
      getMeta(req),
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { document }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const document = await documentService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { document }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await documentService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new DocumentController()
