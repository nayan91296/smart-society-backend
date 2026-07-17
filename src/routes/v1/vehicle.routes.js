import { Router } from 'express'
import parkingController from '../../controllers/parking.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createVehicleRules,
  updateVehicleRules,
  vehicleIdRules,
  vehicleListRules,
} from '../../validators/parking.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(vehicleListRules), parkingController.listVehicles)
router.post('/', validate(createVehicleRules), parkingController.createVehicle)
router.get('/:id', validate(vehicleIdRules), parkingController.getVehicle)
router.patch('/:id', validate(updateVehicleRules), parkingController.updateVehicle)
router.delete('/:id', validate(vehicleIdRules), parkingController.softDeleteVehicle)

export default router
