import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import authController from '../../controllers/auth.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import validate from '../../middlewares/validate.js'
import {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
} from '../../validators/auth.validator.js'
import { HTTP_STATUS, MESSAGES } from '../../constants/index.js'

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
})

const router = Router()

router.post('/register', authRateLimiter, validate(registerRules), authController.register)
router.post('/login', authRateLimiter, validate(loginRules), authController.login)
router.post('/logout', authenticate, authController.logout)
router.post('/refresh-token', authRateLimiter, authController.refreshToken)
router.get('/me', authenticate, authController.me)
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordRules),
  authController.forgotPassword,
)
router.post(
  '/reset-password/:token',
  authRateLimiter,
  validate(resetPasswordRules),
  authController.resetPassword,
)
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordRules),
  authController.changePassword,
)

export default router
