import { body, param, query } from 'express-validator'
import { VISITOR_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const visitorListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('flatId').optional().isMongoId(),
  query('wingId').optional().isMongoId(),
  query('hostMemberId').optional().isMongoId(),
  query('status').optional().isIn(Object.values(VISITOR_STATUS)),
]

export const visitorIdRules = [param('id').isMongoId()]

export const createVisitorRules = [
  body('flatId').isMongoId().withMessage('Flat is required'),
  body('name').trim().notEmpty().withMessage('Visitor name is required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
  body('hostMemberId').optional({ checkFalsy: true }).isMongoId(),
  body('purpose').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('vehicleNumber').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('expectedAt').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('status').optional().isIn(Object.values(VISITOR_STATUS)),
]

export const updateVisitorRules = [
  param('id').isMongoId(),
  body('flatId').optional().isMongoId(),
  body('hostMemberId').optional({ checkFalsy: true }).isMongoId(),
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('phone').optional().trim().notEmpty().isLength({ max: 20 }),
  body('purpose').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('vehicleNumber').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('expectedAt').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
]

export const visitorStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(VISITOR_STATUS)).withMessage('Valid status is required'),
]
