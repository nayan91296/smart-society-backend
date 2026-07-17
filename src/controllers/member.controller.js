import memberService from '../services/member.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'
import { mergeWingScope } from '../helpers/wingScope.helper.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class MemberController {
  list = asyncHandler(async (req, res) => {
    const result = await memberService.list(
      req.societyId,
      mergeWingScope(req.query, req.wingId),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  get = asyncHandler(async (req, res) => {
    const member = await memberService.get(req.societyId, req.params.id, {
      wingId: req.wingId,
    })
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { member }, MESSAGES.SUCCESS))
  })

  create = asyncHandler(async (req, res) => {
    const member = await memberService.create(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
      { wingId: req.wingId },
    )
    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { member }, MESSAGES.CREATED))
  })

  update = asyncHandler(async (req, res) => {
    const member = await memberService.update(
      req.societyId,
      req.params.id,
      req.body,
      req.user,
      getMeta(req),
      { wingId: req.wingId },
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { member }, MESSAGES.UPDATED))
  })

  softDelete = asyncHandler(async (req, res) => {
    const result = await memberService.softDelete(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
      { wingId: req.wingId },
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  toggleActive = asyncHandler(async (req, res) => {
    const member = await memberService.toggleActive(
      req.societyId,
      req.params.id,
      req.user,
      getMeta(req),
      { wingId: req.wingId },
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { member }, MESSAGES.UPDATED))
  })
}

export default new MemberController()
