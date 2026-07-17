import { body, param, query } from 'express-validator'
import { NOTIFICATION_CHANNEL, NOTIFICATION_TYPE } from '../constants/enums.js'
import { ROLES } from '../constants/roles.js'
import { paginationRules } from './common.validator.js'

export const notificationListRules = [
  ...paginationRules,
  query('isRead').optional().isIn(['true', 'false']),
  query('type').optional().isIn(Object.values(NOTIFICATION_TYPE)),
]

export const notificationIdRules = [param('id').isMongoId()]

export const sendNotificationRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('type').optional().isIn(Object.values(NOTIFICATION_TYPE)),
  body('userId').optional({ checkFalsy: true }).isMongoId(),
  body('memberId').optional({ checkFalsy: true }).isMongoId(),
  body('channels')
    .optional()
    .isArray()
    .custom((channels) =>
      channels.every((c) => Object.values(NOTIFICATION_CHANNEL).includes(c)),
    )
    .withMessage('Invalid notification channel'),
  body('data').optional().isObject(),
  body('entityType').optional().trim().isLength({ max: 50 }),
  body('entityId').optional({ checkFalsy: true }).isMongoId(),
]

export const broadcastNotificationRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('type').optional().isIn(Object.values(NOTIFICATION_TYPE)),
  body('roles')
    .optional()
    .isArray()
    .custom((roles) =>
      roles.every((r) => [ROLES.SOCIETY_ADMIN, ROLES.MEMBER].includes(r)),
    )
    .withMessage('Invalid broadcast role'),
  body('channels')
    .optional()
    .isArray()
    .custom((channels) =>
      channels.every((c) => Object.values(NOTIFICATION_CHANNEL).includes(c)),
    )
    .withMessage('Invalid notification channel'),
  body('data').optional().isObject(),
]
