import { body, param, query } from 'express-validator'
import { INVOICE_STATUS, INVOICE_TYPE } from '../constants/enums.js'
import { paginationRules } from './common.validator.js'

const invoiceItemRules = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').optional().isFloat({ min: 0 }),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unitPrice is required'),
]

export const invoiceListRules = [
  ...paginationRules,
  query('search').optional().trim(),
  query('status').optional().isIn(Object.values(INVOICE_STATUS)),
  query('type').optional().isIn(Object.values(INVOICE_TYPE)),
  query('flatId').optional().isMongoId(),
  query('memberId').optional().isMongoId(),
  query('periodStart').optional().isISO8601(),
  query('periodEnd').optional().isISO8601(),
]

export const invoiceIdRules = [param('id').isMongoId()]

export const createInvoiceRules = [
  body('flatId').isMongoId().withMessage('flatId is required'),
  body('type').optional().isIn(Object.values(INVOICE_TYPE)),
  body('memberId').optional({ checkFalsy: true }).isMongoId(),
  ...invoiceItemRules,
  body('taxAmount').optional().isFloat({ min: 0 }),
  body('periodStart').optional({ checkFalsy: true }).isISO8601(),
  body('periodEnd').optional({ checkFalsy: true }).isISO8601(),
  body('issueDate').optional({ checkFalsy: true }).isISO8601(),
  body('dueDate').isISO8601().withMessage('dueDate is required'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
]

export const bulkInvoiceRules = [
  body('flatIds').optional().isArray(),
  body('flatIds.*').optional().isMongoId(),
  body('type').optional().isIn(Object.values(INVOICE_TYPE)),
  ...invoiceItemRules,
  body('taxAmount').optional().isFloat({ min: 0 }),
  body('periodStart').isISO8601().withMessage('periodStart is required'),
  body('periodEnd').isISO8601().withMessage('periodEnd is required'),
  body('issueDate').optional({ checkFalsy: true }).isISO8601(),
  body('dueDate').isISO8601().withMessage('dueDate is required'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
]

export const updateInvoiceRules = [
  param('id').isMongoId(),
  body('flatId').optional().isMongoId(),
  body('type').optional().isIn(Object.values(INVOICE_TYPE)),
  body('memberId').optional({ checkFalsy: true }).isMongoId(),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.description').optional().trim().notEmpty(),
  body('items.*.quantity').optional().isFloat({ min: 0 }),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }),
  body('taxAmount').optional().isFloat({ min: 0 }),
  body('periodStart').optional({ checkFalsy: true }).isISO8601(),
  body('periodEnd').optional({ checkFalsy: true }).isISO8601(),
  body('issueDate').optional({ checkFalsy: true }).isISO8601(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
]

const invoiceStatusValues = [
  ...Object.values(INVOICE_STATUS),
  'ISSUE',
  'CANCEL',
]

export const invoiceStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(invoiceStatusValues).withMessage('Valid status is required'),
]
