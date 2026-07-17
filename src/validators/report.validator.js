import { query } from 'express-validator'

export const reportDateRules = [
  query('from').optional().isISO8601().withMessage('from must be a valid ISO date'),
  query('to').optional().isISO8601().withMessage('to must be a valid ISO date'),
]

export const reportExportRules = [
  ...reportDateRules,
  query('type')
    .optional()
    .isIn([
      'dashboard',
      'occupancy',
      'billing',
      'complaints',
      'visitors',
      'maintenance',
      'parking',
    ]),
  query('format').optional().isIn(['json', 'csv']),
]
