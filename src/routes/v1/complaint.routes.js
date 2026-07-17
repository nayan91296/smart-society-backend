import { Router } from 'express'
import complaintController from '../../controllers/complaint.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import requireWingScope from '../../middlewares/requireWingScope.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  complaintIdRules,
  complaintListRules,
  complaintStatusRules,
  createComplaintRules,
  updateComplaintRules,
} from '../../validators/complaint.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN, ROLES.WING_SECRETARY),
  requireSocietyContext,
  requireWingScope,
)

router.get('/', validate(complaintListRules), complaintController.list)
router.post('/', validate(createComplaintRules), complaintController.create)
router.get('/:id', validate(complaintIdRules), complaintController.get)
router.patch('/:id', validate(updateComplaintRules), complaintController.update)
router.patch('/:id/status', validate(complaintStatusRules), complaintController.updateStatus)
router.delete('/:id', validate(complaintIdRules), complaintController.softDelete)

export default router
