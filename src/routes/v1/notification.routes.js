import { Router } from 'express'
import notificationController from '../../controllers/notification.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import validate from '../../middlewares/validate.js'
import {
  notificationIdRules,
  notificationListRules,
} from '../../validators/notification.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', validate(notificationListRules), notificationController.listMine)
router.get('/unread-count', notificationController.unreadCount)
router.patch('/read-all', notificationController.markAllRead)
router.get('/:id', validate(notificationIdRules), notificationController.getMine)
router.patch('/:id/read', validate(notificationIdRules), notificationController.markRead)

export default router
