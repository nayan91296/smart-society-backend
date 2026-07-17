import wingSecretaryService from '../services/wingSecretary.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class WingSecretaryController {
  get = asyncHandler(async (req, res) => {
    const data = await wingSecretaryService.get(req.societyId, req.params.wingId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.SUCCESS))
  })

  promote = asyncHandler(async (req, res) => {
    const data = await wingSecretaryService.promote(
      req.societyId,
      req.params.wingId,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.UPDATED))
  })

  demote = asyncHandler(async (req, res) => {
    const data = await wingSecretaryService.demote(
      req.societyId,
      req.params.wingId,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, data, MESSAGES.UPDATED))
  })
}

export default new WingSecretaryController()
