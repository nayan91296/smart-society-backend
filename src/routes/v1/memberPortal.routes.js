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
  portalDocumentIdRules,
  portalDocumentListRules,
  portalEventIdRules,
  portalEventListRules,
  portalInvoiceIdRules,
  portalInvoiceListRules,
  portalNoticeIdRules,
  portalNoticeListRules,
  portalPaymentIdRules,
  portalPaymentListRules,
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

router.get('/invoices', validate(portalInvoiceListRules), memberPortalController.listInvoices)
router.get('/invoices/:id', validate(portalInvoiceIdRules), memberPortalController.getInvoice)

router.get('/payments', validate(portalPaymentListRules), memberPortalController.listPayments)
router.get('/payments/:id', validate(portalPaymentIdRules), memberPortalController.getPayment)

router.get('/notices', validate(portalNoticeListRules), memberPortalController.listNotices)
router.get('/notices/:id', validate(portalNoticeIdRules), memberPortalController.getNotice)

router.get('/events', validate(portalEventListRules), memberPortalController.listEvents)
router.get('/events/:id', validate(portalEventIdRules), memberPortalController.getEvent)
router.post('/events/:id/rsvp', validate(portalEventIdRules), memberPortalController.rsvpEvent)
router.delete('/events/:id/rsvp', validate(portalEventIdRules), memberPortalController.cancelRsvp)

router.get('/documents', validate(portalDocumentListRules), memberPortalController.listDocuments)
router.get('/documents/:id', validate(portalDocumentIdRules), memberPortalController.getDocument)

export default router
