import { Router } from 'express'
import memberController from '../../controllers/member.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createMemberRules,
  memberIdRules,
  memberListRules,
  updateMemberRules,
} from '../../validators/member.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(memberListRules), memberController.list)
router.post('/', validate(createMemberRules), memberController.create)
router.get('/:id', validate(memberIdRules), memberController.get)
router.patch('/:id', validate(updateMemberRules), memberController.update)
router.delete('/:id', validate(memberIdRules), memberController.softDelete)
router.patch('/:id/toggle-active', validate(memberIdRules), memberController.toggleActive)

export default router
