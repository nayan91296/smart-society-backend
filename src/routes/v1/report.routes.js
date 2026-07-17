import { Router } from 'express'
import reportController from '../../controllers/report.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireSocietyContext from '../../middlewares/requireSocietyContext.js'
import requireWingScope from '../../middlewares/requireWingScope.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import { reportDateRules, reportExportRules } from '../../validators/report.validator.js'

const router = Router()

const adminOnly = [
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN),
  requireSocietyContext,
]

const wingReports = [
  authenticate,
  authorize(ROLES.SOCIETY_ADMIN, ROLES.SUPER_ADMIN, ROLES.WING_SECRETARY),
  requireSocietyContext,
  requireWingScope,
]

router.get('/dashboard', ...wingReports, validate(reportDateRules), reportController.dashboard)
router.get('/occupancy', ...wingReports, reportController.occupancy)
router.get('/billing', ...adminOnly, validate(reportDateRules), reportController.billing)
router.get('/complaints', ...wingReports, validate(reportDateRules), reportController.complaints)
router.get('/visitors', ...wingReports, validate(reportDateRules), reportController.visitors)
router.get('/maintenance', ...wingReports, validate(reportDateRules), reportController.maintenance)
router.get('/parking', ...adminOnly, reportController.parking)
router.get('/export', ...wingReports, validate(reportExportRules), reportController.export)

export default router
