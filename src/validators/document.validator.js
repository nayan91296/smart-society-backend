import { body, param, query } from 'express-validator'
import { DOCUMENT_VISIBILITY } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const documentListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('visibility').optional().isIn(Object.values(DOCUMENT_VISIBILITY)),
  query('wingId').optional().isMongoId(),
  query('flatId').optional().isMongoId(),
]

export const documentIdRules = [param('id').isMongoId()]

export const createDocumentRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('visibility').optional().isIn(Object.values(DOCUMENT_VISIBILITY)),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('uploadedForMemberId').optional({ checkFalsy: true }).isMongoId(),
]

export const updateDocumentRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('category').optional().trim().notEmpty().isLength({ max: 80 }),
  body('visibility').optional().isIn(Object.values(DOCUMENT_VISIBILITY)),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('uploadedForMemberId').optional({ checkFalsy: true }).isMongoId(),
]
