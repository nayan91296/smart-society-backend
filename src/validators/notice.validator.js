import { body, param, query } from 'express-validator'
import { NOTICE_AUDIENCE, NOTICE_PRIORITY, NOTICE_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const noticeListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(NOTICE_STATUS)),
  query('priority').optional().isIn(Object.values(NOTICE_PRIORITY)),
  query('audience').optional().isIn(Object.values(NOTICE_AUDIENCE)),
]

export const noticeIdRules = [param('id').isMongoId()]

export const createNoticeRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 10000 }),
  body('priority').optional().isIn(Object.values(NOTICE_PRIORITY)),
  body('status').optional().isIn(Object.values(NOTICE_STATUS)),
  body('audience').optional().isIn(Object.values(NOTICE_AUDIENCE)),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('floorId').optional({ checkFalsy: true }).isMongoId(),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('publishAt').optional({ checkFalsy: true }).isISO8601(),
  body('expiresAt').optional({ checkFalsy: true }).isISO8601(),
  body('isPinned').optional().isBoolean(),
  body('eventId').optional({ checkFalsy: true }).isMongoId(),
  body('documentIds').optional().isArray(),
  body('documentIds.*').optional().isMongoId(),
]

export const updateNoticeRules = [
  param('id').isMongoId(),
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('content').optional().trim().notEmpty().isLength({ max: 10000 }),
  body('priority').optional().isIn(Object.values(NOTICE_PRIORITY)),
  body('status').optional().isIn(Object.values(NOTICE_STATUS)),
  body('audience').optional().isIn(Object.values(NOTICE_AUDIENCE)),
  body('wingId').optional({ checkFalsy: true }).isMongoId(),
  body('floorId').optional({ checkFalsy: true }).isMongoId(),
  body('flatId').optional({ checkFalsy: true }).isMongoId(),
  body('publishAt').optional({ checkFalsy: true }).isISO8601(),
  body('expiresAt').optional({ checkFalsy: true }).isISO8601(),
  body('isPinned').optional().isBoolean(),
  body('eventId').optional({ checkFalsy: true }).isMongoId(),
  body('documentIds').optional().isArray(),
  body('documentIds.*').optional().isMongoId(),
]

export const noticeStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(Object.values(NOTICE_STATUS)).withMessage('Valid status is required'),
]
