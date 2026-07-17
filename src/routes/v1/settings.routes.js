import { Router } from 'express'
import settingsController from '../../controllers/settings.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  roleParamRules,
  societyUserListRules,
  updateRolePolicyRules,
  updateSocietySettingsRules,
  updateSocietyUserRules,
} from '../../validators/settings.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/settings', settingsController.getSocietySettings)
router.patch(
  '/settings',
  validate(updateSocietySettingsRules),
  settingsController.updateSocietySettings,
)

router.get('/permissions', settingsController.listPermissions)
router.get('/permissions/me', settingsController.myPermissions)

router.get('/roles', settingsController.listRoles)
router.get('/roles/:role', validate(roleParamRules), settingsController.getRole)
router.patch('/roles/:role', validate(updateRolePolicyRules), settingsController.updateRole)

router.get('/users', validate(societyUserListRules), settingsController.listUsers)
router.patch(
  '/users/:userId',
  validate(updateSocietyUserRules),
  settingsController.updateUser,
)

export default router
