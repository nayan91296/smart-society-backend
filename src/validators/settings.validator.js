import { body, param, query } from 'express-validator'
import { NOTIFICATION_TYPE, PREFERRED_LANGUAGE_VALUES } from '../constants/enums.js'
import { ROLES } from '../constants/roles.js'
import { PERMISSION_VALUES } from '../constants/permissions.js'
import { MANAGEABLE_ROLES, PATCHABLE_USER_ROLES } from '../constants/rolePermissions.js'
import { changePasswordRules } from './auth.validator.js'

export { changePasswordRules }

export const updateSocietySettingsRules = [
  body('timezone').optional().trim().notEmpty().isLength({ max: 60 }),
  body('currency').optional().trim().notEmpty().isLength({ max: 10 }),
  body('maintenanceDueDay').optional().isInt({ min: 1, max: 28 }),
  body('visitorPreApprovalRequired').optional().isBoolean(),
  body('allowMemberVisitorCreation').optional().isBoolean(),
  body('allowMemberComplaintCreation').optional().isBoolean(),
  body('allowMemberVehicleRegistration').optional().isBoolean(),
  body('parkingAutoAssign').optional().isBoolean(),
  body('invoicePrefix').optional().trim().isLength({ max: 10 }),
  body('notifications').optional().isObject(),
  body('notifications.emailEnabled').optional().isBoolean(),
  body('notifications.pushEnabled').optional().isBoolean(),
  body('notifications.whatsappEnabled').optional().isBoolean(),
]

export const updateProfileRules = [
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('avatarUrl').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('preferredLanguage')
    .optional()
    .isIn(PREFERRED_LANGUAGE_VALUES)
    .withMessage('Preferred language must be en or gu'),
]

export const updateNotificationPreferencesRules = [
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

export const societyUserListRules = [
  query('role').optional().isIn([ROLES.SOCIETY_ADMIN, ROLES.WING_SECRETARY, ROLES.MEMBER]),
  query('isActive').optional().isIn(['true', 'false']),
]

export const societyUserIdRules = [param('userId').isMongoId()]

export const updateSocietyUserRules = [
  param('userId').isMongoId(),
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('isActive').optional().isBoolean(),
  body('role')
    .optional()
    .isIn(PATCHABLE_USER_ROLES)
    .withMessage('Use dedicated wing secretary APIs to assign WING_SECRETARY'),
]

export const roleParamRules = [
  param('role')
    .isIn(MANAGEABLE_ROLES)
    .withMessage('Role must be SOCIETY_ADMIN, WING_SECRETARY, or MEMBER'),
]

export const updateRolePolicyRules = [
  ...roleParamRules,
  body('grants')
    .optional()
    .isArray()
    .custom((grants) => grants.every((g) => PERMISSION_VALUES.includes(g)))
    .withMessage('Invalid grant permission'),
  body('denies')
    .optional()
    .isArray()
    .custom((denies) => denies.every((d) => PERMISSION_VALUES.includes(d)))
    .withMessage('Invalid deny permission'),
]
