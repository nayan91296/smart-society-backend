import { body, param, query } from 'express-validator'
import { COMPLAINT_PRIORITY, COMPLAINT_STATUS, VISITOR_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const portalVisitorListRules = [
  ...paginationRules,
  query('status').optional().isIn(Object.values(VISITOR_STATUS)),
]

export const portalCreateVisitorRules = [
  body('name').trim().notEmpty().withMessage('Visitor name is required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
  body('purpose').optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body('vehicleNumber').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('expectedAt').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
]

export const portalVisitorIdRules = [param('id').isMongoId()]

export const portalComplaintListRules = [
  ...paginationRules,
  query('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
  query('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
]

export const portalCreateComplaintRules = [
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 }),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
]

export const portalComplaintIdRules = [param('id').isMongoId()]
