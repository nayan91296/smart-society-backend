import { Router } from 'express'
import noticeController from '../../controllers/notice.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createNoticeRules,
  noticeIdRules,
  noticeListRules,
  noticeStatusRules,
  updateNoticeRules,
} from '../../validators/notice.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(noticeListRules), noticeController.list)
router.post('/', validate(createNoticeRules), noticeController.create)
router.get('/:id', validate(noticeIdRules), noticeController.get)
router.patch('/:id', validate(updateNoticeRules), noticeController.update)
router.patch('/:id/status', validate(noticeStatusRules), noticeController.updateStatus)
router.delete('/:id', validate(noticeIdRules), noticeController.softDelete)

export default router
