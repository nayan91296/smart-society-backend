import { Router } from 'express'
import notificationController from '../../controllers/notification.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  broadcastNotificationRules,
  sendNotificationRules,
} from '../../validators/notification.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/providers', notificationController.providers)
router.post('/send', validate(sendNotificationRules), notificationController.send)
router.post('/broadcast', validate(broadcastNotificationRules), notificationController.broadcast)

export default router
