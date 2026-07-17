import { Router } from 'express'
import paymentController from '../../controllers/payment.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  createPaymentRules,
  paymentIdRules,
  paymentListRules,
  paymentStatusRules,
} from '../../validators/payment.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(paymentListRules), paymentController.list)
router.post('/', validate(createPaymentRules), paymentController.create)
router.get('/:id', validate(paymentIdRules), paymentController.get)
router.patch('/:id/status', validate(paymentStatusRules), paymentController.updateStatus)
router.delete('/:id', validate(paymentIdRules), paymentController.softDelete)

export default router
