import { body, param, query } from 'express-validator'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

export const paymentListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(PAYMENT_STATUS)),
  query('method').optional().isIn(Object.values(PAYMENT_METHOD)),
  query('invoiceId').optional().isMongoId(),
  query('flatId').optional().isMongoId(),
]

export const paymentIdRules = [param('id').isMongoId()]

export const createPaymentRules = [
  body('invoiceId').isMongoId().withMessage('invoiceId is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
  body('method').isIn(Object.values(PAYMENT_METHOD)).withMessage('Valid method is required'),
  body('transactionId').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('paidAt').optional({ checkFalsy: true }).isISO8601(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('status').optional().isIn([PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.PENDING]),
]

export const paymentStatusRules = [
  param('id').isMongoId(),
  body('status')
    .isIn([PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.FAILED, PAYMENT_STATUS.REFUNDED])
    .withMessage('Valid status is required'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
]
