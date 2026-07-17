import { Router } from 'express'
import eventController from '../../controllers/event.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createEventRules,
  eventIdRules,
  eventListRules,
  eventStatusRules,
  updateEventRules,
} from '../../validators/event.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(eventListRules), eventController.list)
router.post('/', validate(createEventRules), eventController.create)
router.get('/:id', validate(eventIdRules), eventController.get)
router.patch('/:id', validate(updateEventRules), eventController.update)
router.patch('/:id/status', validate(eventStatusRules), eventController.updateStatus)
router.delete('/:id', validate(eventIdRules), eventController.softDelete)

export default router
