import { Router } from 'express'
import reportController from '../../controllers/report.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import { reportDateRules, reportExportRules } from '../../validators/report.validator.js'

const router = Router()

router.use(
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
)

router.get('/dashboard', validate(reportDateRules), reportController.dashboard)
router.get('/occupancy', reportController.occupancy)
router.get('/billing', validate(reportDateRules), reportController.billing)
router.get('/complaints', validate(reportDateRules), reportController.complaints)
router.get('/visitors', validate(reportDateRules), reportController.visitors)
router.get('/maintenance', validate(reportDateRules), reportController.maintenance)
router.get('/parking', reportController.parking)
router.get('/export', validate(reportExportRules), reportController.export)

export default router
