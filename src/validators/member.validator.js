import { body, param, query } from 'express-validator'
import { MEMBER_RELATION, OWNERSHIP_TYPE } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const memberListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('flatId').optional().isMongoId(),
  query('wingId').optional().isMongoId(),
  query('ownershipType').optional().isIn(Object.values(OWNERSHIP_TYPE)),
  query('isActive').optional().isIn(['true', 'false']),
]

export const memberIdRules = [param('id').isMongoId()]

export const createMemberRules = [
  body('flatId').isMongoId().withMessage('Flat is required'),
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('phone').trim().notEmpty().withMessage('Phone is required').isLength({ max: 20 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail(),
  body('ownershipType').optional().isIn(Object.values(OWNERSHIP_TYPE)),
  body('relation').optional().isIn(Object.values(MEMBER_RELATION)),
  body('isPrimary').optional().isBoolean(),
  body('moveInDate').optional({ checkFalsy: true }).isISO8601(),
  body('moveOutDate').optional({ checkFalsy: true }).isISO8601(),
  body('isActive').optional().isBoolean(),
  body('createLogin').optional().isBoolean(),
  body('password')
    .if((_value, { req }) => req.body.createLogin === true || req.body.createLogin === 'true')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters when createLogin is true'),
]

export const updateMemberRules = [
  param('id').isMongoId(),
  body('flatId').optional().isMongoId(),
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('phone').optional().trim().notEmpty().isLength({ max: 20 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail(),
  body('ownershipType').optional().isIn(Object.values(OWNERSHIP_TYPE)),
  body('relation').optional().isIn(Object.values(MEMBER_RELATION)),
  body('isPrimary').optional().isBoolean(),
  body('moveInDate').optional({ checkFalsy: true }).isISO8601(),
  body('moveOutDate').optional({ checkFalsy: true }).isISO8601(),
  body('isActive').optional().isBoolean(),
]
