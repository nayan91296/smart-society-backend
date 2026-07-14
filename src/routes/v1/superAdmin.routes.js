import { Router } from 'express'
import superAdminController from '../../controllers/superAdmin.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import authorize from '../../middlewares/authorize.js'
import validate from '../../middlewares/validate.js'
import { ROLES } from '../../constants/roles.js'
import {
  activityLogListRules,
  createSocietyRules,
  societyIdRules,
  societyListRules,
  societyStatusRules,
  ticketListRules,
  updateSocietyRules,
  updateTicketRules,
  userListRules,
  userStatusRules,
} from '../../validators/superAdmin.validator.js'

const router = Router()

router.use(authenticate, authorize(ROLES.SUPER_ADMIN))

router.get('/dashboard', superAdminController.getDashboard)

router.get('/societies', validate(societyListRules), superAdminController.listSocieties)
router.post('/societies', validate(createSocietyRules), superAdminController.createSociety)
router.get('/societies/:id', validate(societyIdRules), superAdminController.getSociety)
router.patch('/societies/:id', validate(updateSocietyRules), superAdminController.updateSociety)
router.patch(
  '/societies/:id/status',
  validate(societyStatusRules),
  superAdminController.updateSocietyStatus,
)

router.get('/users', validate(userListRules), superAdminController.listUsers)
router.patch('/users/:id/status', validate(userStatusRules), superAdminController.updateUserStatus)

router.get(
  '/support-tickets',
  validate(ticketListRules),
  superAdminController.listSupportTickets,
)
router.patch(
  '/support-tickets/:id',
  validate(updateTicketRules),
  superAdminController.updateSupportTicket,
)

router.get(
  '/activity-logs',
  validate(activityLogListRules),
  superAdminController.listActivityLogs,
)

export default router
