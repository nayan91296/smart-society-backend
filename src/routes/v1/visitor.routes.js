import { Router } from 'express'
import visitorController from '../../controllers/visitor.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createVisitorRules,
  updateVisitorRules,
  visitorIdRules,
  visitorListRules,
  visitorStatusRules,
} from '../../validators/visitor.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(visitorListRules), visitorController.list)
router.post('/', validate(createVisitorRules), visitorController.create)
router.get('/:id', validate(visitorIdRules), visitorController.get)
router.patch('/:id', validate(updateVisitorRules), visitorController.update)
router.patch('/:id/status', validate(visitorStatusRules), visitorController.updateStatus)
router.delete('/:id', validate(visitorIdRules), visitorController.softDelete)

export default router
