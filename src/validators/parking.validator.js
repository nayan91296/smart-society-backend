import { body, param, query } from 'express-validator'
import { PARKING_STATUS, PARKING_TYPE, VEHICLE_TYPE } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const parkingListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(PARKING_STATUS)),
  query('type').optional().isIn(Object.values(PARKING_TYPE)),
  query('wingId').optional().isMongoId(),
  query('isActive').optional().isIn(['true', 'false']),
  query('available').optional().isIn(['true', 'false']),
]

export const parkingIdRules = [param('id').isMongoId()]

export const createParkingRules = [
  body('slotNumber').trim().notEmpty().withMessage('Slot number is required').isLength({ max: 30 }),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('type').optional().isIn(Object.values(PARKING_TYPE)),
  body('status')
    .optional()
    .isIn([PARKING_STATUS.AVAILABLE, PARKING_STATUS.RESERVED, PARKING_STATUS.BLOCKED]),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
]

export const updateParkingRules = [
  param('id').isMongoId(),
  body('slotNumber').optional().trim().notEmpty().isLength({ max: 30 }),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('type').optional().isIn(Object.values(PARKING_TYPE)),
  body('status').optional().isIn(Object.values(PARKING_STATUS)),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
]

export const assignParkingRules = [
  param('id').isMongoId(),
  body('vehicleId').isMongoId().withMessage('vehicleId is required'),
]

export const vehicleListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('flatId').optional().isMongoId(),
  query('memberId').optional().isMongoId(),
  query('type').optional().isIn(Object.values(VEHICLE_TYPE)),
  query('isActive').optional().isIn(['true', 'false']),
  query('assigned').optional().isIn(['true', 'false']),
]

export const vehicleIdRules = [param('id').isMongoId()]

export const createVehicleRules = [
  body('flatId').isMongoId().withMessage('flatId is required'),
  body('memberId').optional({ checkFalsy: true }).isMongoId(),
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required')
    .isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(VEHICLE_TYPE)),
  body('make').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('model').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('isActive').optional().isBoolean(),
]

export const updateVehicleRules = [
  param('id').isMongoId(),
  body('flatId').optional().isMongoId(),
  body('memberId').optional({ checkFalsy: true }).isMongoId(),
  body('vehicleNumber').optional().trim().notEmpty().isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(VEHICLE_TYPE)),
  body('make').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('model').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('isActive').optional().isBoolean(),
]

export const memberCreateVehicleRules = [
  body('vehicleNumber')
    .trim()
    .notEmpty()
    .withMessage('Vehicle number is required')
    .isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(VEHICLE_TYPE)),
  body('make').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('model').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
]

export const memberUpdateVehicleRules = [
  param('id').isMongoId(),
  body('vehicleNumber').optional().trim().notEmpty().isLength({ max: 20 }),
  body('type').optional().isIn(Object.values(VEHICLE_TYPE)),
  body('make').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('model').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('color').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
]
