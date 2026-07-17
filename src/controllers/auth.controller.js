import authService from '../services/auth.service.js'
import tokenService from '../services/token.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const REFRESH_COOKIE_NAME = 'refreshToken'

const setRefreshCookie = (res, refreshToken, rememberMe = false) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, tokenService.getRefreshCookieOptions(rememberMe))
}

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: tokenService.getRefreshCookieOptions().secure,
    sameSite: tokenService.getRefreshCookieOptions().sameSite,
    path: '/',
  })
}

const getRequestMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

class AuthController {
  register = asyncHandler(async (req, res) => {
    const user = await authService.registerSocietyAdmin(req.body)

    res
      .status(HTTP_STATUS.CREATED)
      .json(new ApiResponse(HTTP_STATUS.CREATED, { user }, MESSAGES.REGISTER_SUCCESS))
  })

  login = asyncHandler(async (req, res) => {
    const { email, password, rememberMe = false } = req.body
    const result = await authService.login({ email, password, rememberMe }, getRequestMeta(req))

    setRefreshCookie(res, result.refreshToken, result.rememberMe)

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        MESSAGES.LOGIN_SUCCESS,
      ),
    )
  })

  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
    await authService.logout(refreshToken)
    clearRefreshCookie(res)

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, MESSAGES.LOGOUT_SUCCESS))
  })

  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]
    const result = await authService.refreshTokens(refreshToken, getRequestMeta(req))

    setRefreshCookie(res, result.refreshToken, false)

    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        MESSAGES.TOKEN_REFRESHED,
      ),
    )
  })

  me = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id)

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { user }, MESSAGES.SUCCESS))
  })

  forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email)

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, result.message))
  })

  resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.params.token, req.body.password)

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  changePassword = asyncHandler(async (req, res) => {
    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    )

    clearRefreshCookie(res)

    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  logoutAll = asyncHandler(async (req, res) => {
    const result = await authService.logoutAllSessions(req.user.id)
    clearRefreshCookie(res)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })
}

export default new AuthController()
