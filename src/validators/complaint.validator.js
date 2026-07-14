import { body, param, query } from 'express-validator'
import { COMPLAINT_PRIORITY, COMPLAINT_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const complaintListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('flatId').optional().isMongoId(),
  query('wingId').optional().isMongoId(),
  query('raisedByMemberId').optional().isMongoId(),
  query('category').optional().trim(),
  query('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
  query('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
]

export const complaintIdRules = [param('id').isMongoId()]

export const createComplaintRules = [
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 }),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('raisedByMemberId').optional({ checkFalsy: true }).isMongoId(),
]

export const updateComplaintRules = [
  param('id').isMongoId(),
  body('category').optional().trim().notEmpty().isLength({ max: 80 }),
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional().trim().notEmpty().isLength({ max: 2000 }),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  body('status').optional().isIn(Object.values(COMPLAINT_STATUS)),
  body('resolutionNotes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
]

export const complaintStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(COMPLAINT_STATUS)).withMessage('Valid status is required'),
  body('priority').optional().isIn(Object.values(COMPLAINT_PRIORITY)),
  body('resolutionNotes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
]
