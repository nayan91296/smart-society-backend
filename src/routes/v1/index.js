import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import superAdminRoutes from './superAdmin.routes.js'
import societyRoutes from './society.routes.js'
import memberRoutes from './member.routes.js'
import visitorRoutes from './visitor.routes.js'
import complaintRoutes from './complaint.routes.js'
import maintenanceRoutes from './maintenance.routes.js'
import invoiceRoutes from './invoice.routes.js'
import paymentRoutes from './payment.routes.js'
import noticeRoutes from './notice.routes.js'
import eventRoutes from './event.routes.js'
import documentRoutes from './document.routes.js'
import parkingRoutes from './parking.routes.js'
import vehicleRoutes from './vehicle.routes.js'
import reportRoutes from './report.routes.js'
import notificationRoutes from './notification.routes.js'
import societyNotificationRoutes from './societyNotification.routes.js'
import settingsRoutes from './settings.routes.js'
import memberPortalRoutes from './memberPortal.routes.js'
import memberSettingsRoutes from './memberSettings.routes.js'

const router = Router()

router.use(healthRoutes)
router.use('/auth', authRoutes)
router.use('/super-admin', superAdminRoutes)
router.use('/notifications', notificationRoutes)
router.use('/society/members', memberRoutes)
router.use('/society/visitors', visitorRoutes)
router.use('/society/complaints', complaintRoutes)
router.use('/society/maintenance', maintenanceRoutes)
router.use('/society/invoices', invoiceRoutes)
router.use('/society/payments', paymentRoutes)
router.use('/society/notices', noticeRoutes)
router.use('/society/events', eventRoutes)
router.use('/society/documents', documentRoutes)
router.use('/society/parking', parkingRoutes)
router.use('/society/vehicles', vehicleRoutes)
router.use('/society/reports', reportRoutes)
router.use('/society/notifications', societyNotificationRoutes)
router.use('/society', settingsRoutes)
router.use('/society', societyRoutes)
router.use('/member', memberSettingsRoutes)
router.use('/member', memberPortalRoutes)

export default router
