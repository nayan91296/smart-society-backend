import { Router } from 'express'
import invoiceController from '../../controllers/invoice.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  bulkInvoiceRules,
  createInvoiceRules,
  invoiceIdRules,
  invoiceListRules,
  invoiceStatusRules,
  updateInvoiceRules,
} from '../../validators/invoice.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/', validate(invoiceListRules), invoiceController.list)
router.post('/', validate(createInvoiceRules), invoiceController.create)
router.post('/bulk', validate(bulkInvoiceRules), invoiceController.bulkCreate)
router.get('/:id', validate(invoiceIdRules), invoiceController.get)
router.patch('/:id', validate(updateInvoiceRules), invoiceController.update)
router.patch('/:id/status', validate(invoiceStatusRules), invoiceController.updateStatus)
router.delete('/:id', validate(invoiceIdRules), invoiceController.softDelete)

export default router
