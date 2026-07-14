import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import superAdminRoutes from './superAdmin.routes.js'
import societyRoutes from './society.routes.js'
import memberRoutes from './member.routes.js'
import visitorRoutes from './visitor.routes.js'
import complaintRoutes from './complaint.routes.js'
import memberPortalRoutes from './memberPortal.routes.js'

const router = Router()

router.use(healthRoutes)
router.use('/auth', authRoutes)
router.use('/super-admin', superAdminRoutes)
router.use('/society/members', memberRoutes)
router.use('/society/visitors', visitorRoutes)
router.use('/society/complaints', complaintRoutes)
router.use('/society', societyRoutes)
router.use('/member', memberPortalRoutes)

export default router
