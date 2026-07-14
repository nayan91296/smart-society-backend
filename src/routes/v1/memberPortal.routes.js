import { Router } from 'express'
import memberPortalController from '../../controllers/memberPortal.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import requireMemberProfile from '../../middlewares/requireMemberProfile.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  portalComplaintIdRules,
  portalComplaintListRules,
  portalCreateComplaintRules,
  portalCreateVisitorRules,
  portalVisitorIdRules,
  portalVisitorListRules,
} from '../../validators/memberPortal.validator.js'

const router = Router()

router.use(authenticate, authorize(ROLES.MEMBER), ...requireMemberProfile)

router.get('/dashboard', memberPortalController.getDashboard)

router.get('/visitors', validate(portalVisitorListRules), memberPortalController.listVisitors)
router.post('/visitors', validate(portalCreateVisitorRules), memberPortalController.createVisitor)
router.patch(
  '/visitors/:id/cancel',
  validate(portalVisitorIdRules),
  memberPortalController.cancelVisitor,
)

router.get(
  '/complaints',
  validate(portalComplaintListRules),
  memberPortalController.listComplaints,
)
router.post(
  '/complaints',
  validate(portalCreateComplaintRules),
  memberPortalController.createComplaint,
)
router.get(
  '/complaints/:id',
  validate(portalComplaintIdRules),
  memberPortalController.getComplaint,
)

export default router
