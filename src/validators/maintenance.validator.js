import { body, param, query } from 'express-validator'
import { COMPLAINT_PRIORITY, MAINTENANCE_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const maintenanceListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(MAINTENANCE_STATUS)),
  query('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  query('flatId').optional().isMongoId(),
  query('category').optional().trim(),
]

export const maintenanceIdRules = [param('id').isMongoId()]

export const createMaintenanceRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  body('status').optional().isIn(Object.values(MAINTENANCE_STATUS)),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('assignedStaffId').optional({ checkFalsy: true }).isMongoId(),
  body('relatedComplaintId').optional({ checkFalsy: true }).isMongoId(),
  body('scheduledAt').optional({ checkFalsy: true }).isISO8601(),
  body('estimatedCost').optional().isFloat({ min: 0 }),
  body('actualCost').optional().isFloat({ min: 0 }),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
]

export const updateMaintenanceRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('category').optional().trim().notEmpty().isLength({ max: 80 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  body('status').optional().isIn(Object.values(MAINTENANCE_STATUS)),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('assignedStaffId').optional({ checkFalsy: true }).isMongoId(),
  body('relatedComplaintId').optional({ checkFalsy: true }).isMongoId(),
  body('scheduledAt').optional({ checkFalsy: true }).isISO8601(),
  body('estimatedCost').optional().isFloat({ min: 0 }),
  body('actualCost').optional().isFloat({ min: 0 }),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
]

export const maintenanceStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(MAINTENANCE_STATUS)).withMessage('Valid status is required'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('actualCost').optional().isFloat({ min: 0 }),
]
