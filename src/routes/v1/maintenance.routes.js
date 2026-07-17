import { Router } from 'express'
import maintenanceController from '../../controllers/maintenance.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import requireWingScope from '../../middlewares/requireWingScope.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createMaintenanceRules,
  maintenanceIdRules,
  maintenanceListRules,
  maintenanceStatusRules,
  updateMaintenanceRules,
} from '../../validators/maintenance.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN, ROLES.WING_SECRETARY),
  requireSocietyContext,
  requireWingScope,
)

router.get('/', validate(maintenanceListRules), maintenanceController.list)
router.post('/', validate(createMaintenanceRules), maintenanceController.create)
router.get('/:id', validate(maintenanceIdRules), maintenanceController.get)
router.patch('/:id', validate(updateMaintenanceRules), maintenanceController.update)
router.patch('/:id/status', validate(maintenanceStatusRules), maintenanceController.updateStatus)
router.delete('/:id', validate(maintenanceIdRules), maintenanceController.softDelete)

export default router
