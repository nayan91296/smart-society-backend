import { body, param, query } from 'express-validator'
import { FLAT_STATUS, FLAT_TYPES } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const updateProfileRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('email').optional({ checkFalsy: true }).trim().isEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('registrationNumber').optional({ checkFalsy: true }).trim(),
  body('address').optional().isObject(),
  body('settings').optional().isObject(),
  body('settings.timezone').optional().trim(),
  body('settings.currency').optional().trim(),
  body('settings.maintenanceDueDay').optional().isInt({ min: 1, max: 28 }),
]

export const createWingRules = [
  body('name').trim().notEmpty().withMessage('Wing name is required').isLength({ max: 50 }),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Wing code is required')
    .isLength({ max: 20 })
    .matches(/^[A-Za-z0-9_-]+$/),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('totalFloors').optional().isInt({ min: 0 }),
]

export const wingListRules = [
  query('search').optional().trim(),
  query('isActive').optional().isIn(['true', 'false']),
]

export const updateWingRules = [
  param('id').isMongoId(),
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('totalFloors').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
]

export const wingIdRules = [param('id').isMongoId()]
export const wingIdParamRules = [param('wingId').isMongoId()]

export const floorListRules = [
  query('search').optional().trim(),
  query('wingId').optional().isMongoId(),
  query('isActive').optional().isIn(['true', 'false']),
]

export const createFloorRules = [
  param('wingId').isMongoId(),
  body('floorNumber').isInt().withMessage('Floor number is required'),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
]

export const bulkCreateFloorRules = [
  param('wingId').isMongoId(),
  body('from').isInt().withMessage('from is required'),
  body('to').isInt().withMessage('to is required'),
  body('namePrefix').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
]

export const updateFloorRules = [
  param('id').isMongoId(),
  body('floorNumber').optional().isInt(),
  body('name').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('isActive').optional().isBoolean(),
]

export const floorIdRules = [param('id').isMongoId()]

export const flatListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('wingId').optional().isMongoId(),
  query('floorId').optional().isMongoId(),
  query('status').optional().isIn(Object.values(FLAT_STATUS)),
  query('type').optional().isIn(Object.values(FLAT_TYPES)),
]

export const createFlatRules = [
  body('wingId').isMongoId().withMessage('Wing is required'),
  body('floorId').isMongoId().withMessage('Floor is required'),
  body('flatNumber').trim().notEmpty().withMessage('Flat number is required').isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(FLAT_TYPES)),
  body('status').optional().isIn(Object.values(FLAT_STATUS)),
  body('areaSqFt').optional().isFloat({ min: 0 }),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isInt({ min: 0 }),
]

export const updateFlatRules = [
  param('id').isMongoId(),
  body('flatNumber').optional().trim().notEmpty().isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(FLAT_TYPES)),
  body('status').optional().isIn(Object.values(FLAT_STATUS)),
  body('areaSqFt').optional().isFloat({ min: 0 }),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  body('wingId').optional().isMongoId(),
  body('floorId').optional().isMongoId(),
]

export const flatIdRules = [param('id').isMongoId()]

export const promoteWingSecretaryRules = [
  param('wingId').isMongoId(),
  body('userId').isMongoId().withMessage('userId is required'),
]

export const wingSecretaryParamRules = [param('wingId').isMongoId()]
