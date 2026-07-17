import { Router } from 'express'
import settingsController from '../../controllers/settings.controller.js'
import parkingController from '../../controllers/parking.controller.js'
import notificationController from '../../controllers/notification.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireMemberProfile from '../../middlewares/requireMemberProfile.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  memberCreateVehicleRules,
  memberUpdateVehicleRules,
  vehicleIdRules,
} from '../../validators/parking.validator.js'
import {
  notificationIdRules,
  notificationListRules,
} from '../../validators/notification.validator.js'
import {
  changePasswordRules,
  updateNotificationPreferencesRules,
  updateProfileRules,
} from '../../validators/settings.validator.js'

const router = Router()

router.use(authenticate, authorize(ROLES.MEMBER), ...requireMemberProfile)

// Vehicles & parking
router.get('/vehicles', parkingController.listMyVehicles)
router.post('/vehicles', validate(memberCreateVehicleRules), parkingController.createMyVehicle)
router.patch(
  '/vehicles/:id',
  validate(memberUpdateVehicleRules),
  parkingController.updateMyVehicle,
)
router.delete('/vehicles/:id', validate(vehicleIdRules), parkingController.deleteMyVehicle)
router.get('/parking', parkingController.getMyParking)

// Notifications (member convenience aliases)
router.get('/notifications', validate(notificationListRules), notificationController.listMine)
router.get('/notifications/unread-count', notificationController.unreadCount)
router.patch('/notifications/read-all', notificationController.markAllRead)
router.patch(
  '/notifications/:id/read',
  validate(notificationIdRules),
  notificationController.markRead,
)

// Profile & settings
router.get('/profile', settingsController.getProfile)
router.patch('/profile', validate(updateProfileRules), settingsController.updateProfile)
router.get('/settings', settingsController.getNotificationPreferences)
router.patch(
  '/settings',
  validate(updateNotificationPreferencesRules),
  settingsController.updateNotificationPreferences,
)

// Security
router.post('/security/change-password', validate(changePasswordRules), settingsController.changePassword)
router.post('/security/logout-all', settingsController.logoutAll)
router.get('/permissions', settingsController.myPermissions)

export default router
