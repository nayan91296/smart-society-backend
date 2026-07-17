import { body, param, query } from 'express-validator'
import { EVENT_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const eventListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(EVENT_STATUS)),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
]

export const eventIdRules = [param('id').isMongoId()]

export const createEventRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('startAt').isISO8601().withMessage('startAt is required'),
  body('endAt').isISO8601().withMessage('endAt is required'),
  body('status').optional().isIn(Object.values(EVENT_STATUS)),
  body('maxAttendees').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('coverImageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
]

export const updateEventRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
  body('location').optional({ checkFalsy: true }).trim().isLength({ max: 200 }),
  body('startAt').optional().isISO8601(),
  body('endAt').optional().isISO8601(),
  body('status').optional().isIn(Object.values(EVENT_STATUS)),
  body('maxAttendees').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('coverImageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
]

export const eventStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(EVENT_STATUS)).withMessage('Valid status is required'),
]
