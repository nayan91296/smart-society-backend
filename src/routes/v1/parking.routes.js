import { Router } from 'express'
import parkingController from '../../controllers/parking.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  assignParkingRules,
  createParkingRules,
  parkingIdRules,
  parkingListRules,
  updateParkingRules,
} from '../../validators/parking.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(parkingListRules), parkingController.list)
router.post('/', validate(createParkingRules), parkingController.create)
router.get('/:id', validate(parkingIdRules), parkingController.get)
router.patch('/:id', validate(updateParkingRules), parkingController.update)
router.delete('/:id', validate(parkingIdRules), parkingController.softDelete)
router.post('/:id/assign', validate(assignParkingRules), parkingController.assign)
router.post('/:id/unassign', validate(parkingIdRules), parkingController.unassign)

export default router
