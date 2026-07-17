import { body, param, query } from 'express-validator'
import { SOCIETY_STATUS, SUPPORT_TICKET_STATUS } from '../constants/enums.js'
import { ROLE_VALUES } from '../constants/roles.js'
import { paginationRules } from './common.validator.js'

export const societyListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(SOCIETY_STATUS)),
]

export const societyContextRules = [
  body('societyId')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || /^[a-fA-F0-9]{24}$/.test(value))
    .withMessage('societyId must be a valid Mongo id or null to clear'),
]

export const createSocietyRules = [
  body('name').trim().notEmpty().withMessage('Society name is required').isLength({ max: 150 }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Society code is required')
    .isLength({ max: 30 })
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Code can only contain letters, numbers, - and _'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Valid email required'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('registrationNumber').optional({ checkFalsy: true }).trim(),
  body('address').optional().isObject(),
  body('address.line1').optional({ checkFalsy: true }).trim(),
  body('address.city').optional({ checkFalsy: true }).trim(),
  body('address.state').optional({ checkFalsy: true }).trim(),
  body('address.postalCode').optional({ checkFalsy: true }).trim(),
  body('adminUserId').optional({ checkFalsy: true }).isMongoId(),
  body('adminEmail').optional({ checkFalsy: true }).trim().isEmail(),
  body('adminFirstName').optional({ checkFalsy: true }).trim(),
  body('adminLastName').optional({ checkFalsy: true }).trim(),
  body('adminPassword')
    .optional({ checkFalsy: true })
    .isLength({ min: 8 })
    .withMessage('Admin password must be at least 8 characters'),
]

export const updateSocietyRules = [
  param('id').isMongoId().withMessage('Invalid society id'),
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('registrationNumber').optional({ checkFalsy: true }).trim(),
  body('address').optional().isObject(),
  body('admin').optional({ checkFalsy: true }).isMongoId(),
]

export const societyStatusRules = [
  param('id').isMongoId().withMessage('Invalid society id'),
  body('status')
    .isIn(Object.values(SOCIETY_STATUS))
    .withMessage('Invalid society status'),
]

export const societyIdRules = [param('id').isMongoId().withMessage('Invalid society id')]

export const userListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('role').optional().isIn(ROLE_VALUES),
  query('isActive').optional().isIn(['true', 'false']),
  query('societyId').optional().isMongoId(),
]

export const userStatusRules = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
]

export const ticketListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(SUPPORT_TICKET_STATUS)),
]

export const updateTicketRules = [
  param('id').isMongoId().withMessage('Invalid ticket id'),
  body('status').optional().isIn(Object.values(SUPPORT_TICKET_STATUS)),
  body('assignedTo').optional({ checkFalsy: true }).isMongoId(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
]

export const activityLogListRules = [
  ...paginationRules,
  query('action').optional().trim(),
  query('entityType').optional().trim(),
]
