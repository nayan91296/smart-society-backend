import settingsService from '../services/settings.service.js'
import roleService from '../services/role.service.js'
import tokenService from '../services/token.service.js'
import { HTTP_STATUS, MESSAGES } from '../constants/index.js'
import { ApiResponse, asyncHandler } from '../utils/index.js'

const getMeta = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
})

const REFRESH_COOKIE_NAME = 'refreshToken'

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: tokenService.getRefreshCookieOptions().secure,
    sameSite: tokenService.getRefreshCookieOptions().sameSite,
    path: '/',
  })
}

class SettingsController {
  getSocietySettings = asyncHandler(async (req, res) => {
    const result = await settingsService.getSocietySettings(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  updateSocietySettings = asyncHandler(async (req, res) => {
    const result = await settingsService.updateSocietySettings(
      req.societyId,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.UPDATED))
  })

  getProfile = asyncHandler(async (req, res) => {
    const profile = await settingsService.getProfile(req.user.id)
    const permissions = await roleService.getEffectivePermissions(req.user, req.societyId)
    res.status(HTTP_STATUS.OK).json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { profile, permissions: permissions.permissions },
        MESSAGES.SUCCESS,
      ),
    )
  })

  updateProfile = asyncHandler(async (req, res) => {
    const profile = await settingsService.updateProfile(req.user.id, req.body, getMeta(req))
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, { profile }, MESSAGES.UPDATED))
  })

  getNotificationPreferences = asyncHandler(async (req, res) => {
    const result = await settingsService.getNotificationPreferences(req.user.id)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  updateNotificationPreferences = asyncHandler(async (req, res) => {
    const result = await settingsService.updateNotificationPreferences(
      req.user.id,
      req.body,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.UPDATED))
  })

  changePassword = asyncHandler(async (req, res) => {
    const result = await settingsService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    )
    clearRefreshCookie(res)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  logoutAll = asyncHandler(async (req, res) => {
    const result = await settingsService.logoutAllSessions(req.user.id)
    clearRefreshCookie(res)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message))
  })

  listUsers = asyncHandler(async (req, res) => {
    const result = await settingsService.listSocietyUsers(req.societyId, req.query)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  updateUser = asyncHandler(async (req, res) => {
    const result = await settingsService.updateSocietyUser(
      req.societyId,
      req.params.userId,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.UPDATED))
  })

  listPermissions = asyncHandler(async (req, res) => {
    const result = await roleService.getPermissionCatalog()
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  listRoles = asyncHandler(async (req, res) => {
    const result = await roleService.listRoles(req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  getRole = asyncHandler(async (req, res) => {
    const result = await roleService.getRole(req.societyId, req.params.role)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })

  updateRole = asyncHandler(async (req, res) => {
    const result = await roleService.updateRolePolicy(
      req.societyId,
      req.params.role,
      req.body,
      req.user,
      getMeta(req),
    )
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.UPDATED))
  })

  myPermissions = asyncHandler(async (req, res) => {
    const result = await roleService.getEffectivePermissions(req.user, req.societyId)
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, MESSAGES.SUCCESS))
  })
}

export default new SettingsController()
