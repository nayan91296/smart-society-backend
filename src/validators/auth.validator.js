import { body } from 'express-validator'
import { NOTIFICATION_TYPE, PREFERRED_LANGUAGE_VALUES } from '../constants/enums.js'

const passwordRule = (field = 'password') =>
  body(field)
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')

export const registerRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRule('password'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  body('preferredLanguage')
    .optional()
    .isIn(PREFERRED_LANGUAGE_VALUES)
    .withMessage('Preferred language must be en or gu'),
]

export const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('Remember me must be a boolean'),
]

export const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
]

export const resetPasswordRules = [
  passwordRule('password'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
]

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordRule('newPassword'),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
]

export const updatePreferencesRules = [
  body('preferredLanguage')
    .optional()
    .isIn(PREFERRED_LANGUAGE_VALUES)
    .withMessage('Preferred language must be en or gu'),
  body('notificationPreferences').optional().isObject(),
  body('notificationPreferences.channels').optional().isObject(),
  body('notificationPreferences.channels.inApp.enabled').optional().isBoolean(),
  body('notificationPreferences.channels.email.enabled').optional().isBoolean(),
  body('notificationPreferences.channels.push.enabled').optional().isBoolean(),
  body('notificationPreferences.channels.whatsapp.enabled').optional().isBoolean(),
  body('notificationPreferences.mutedTypes')
    .optional()
    .isArray()
    .custom((types) => types.every((t) => Object.values(NOTIFICATION_TYPE).includes(t)))
    .withMessage('Invalid muted notification type'),
  body('channels').optional().isObject(),
  body('channels.inApp.enabled').optional().isBoolean(),
  body('channels.email.enabled').optional().isBoolean(),
  body('channels.push.enabled').optional().isBoolean(),
  body('channels.whatsapp.enabled').optional().isBoolean(),
  body('mutedTypes')
    .optional()
    .isArray()
    .custom((types) => types.every((t) => Object.values(NOTIFICATION_TYPE).includes(t)))
    .withMessage('Invalid muted notification type'),
]
