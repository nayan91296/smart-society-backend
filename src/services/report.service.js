import mongoose from 'mongoose'
import Flat from '../models/flat.model.js'
import Member from '../models/member.model.js'
import Complaint from '../models/complaint.model.js'
import Visitor from '../models/visitor.model.js'
import Maintenance from '../models/maintenance.model.js'
import Invoice from '../models/invoice.model.js'
import Payment from '../models/payment.model.js'
import Parking from '../models/parking.model.js'
import Vehicle from '../models/vehicle.model.js'
import {
  COMPLAINT_STATUS,
  FLAT_STATUS,
  HTTP_STATUS,
  INVOICE_STATUS,
  MAINTENANCE_STATUS,
  PARKING_STATUS,
  PAYMENT_STATUS,
  VISITOR_STATUS,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

const toObjectId = (id) => new mongoose.Types.ObjectId(id)

const parseDateRange = (query = {}) => {
  const from = query.from ? new Date(query.from) : null
  let to = query.to ? new Date(query.to) : null

  if (from && Number.isNaN(from.getTime())) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid from date')
  }
  if (to && Number.isNaN(to.getTime())) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid to date')
  }

  if (from && to && from > to) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'from date must be before to date')
  }

  if (to) {
    to = new Date(to)
    to.setHours(23, 59, 59, 999)
  }

  return { from, to }
}

const dateMatch = (field, from, to) => {
  if (!from && !to) return {}
  const range = {}
  if (from) range.$gte = from
  if (to) range.$lte = to
  return { [field]: range }
}

const groupCounts = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || 'UNKNOWN'] = row.count
    return acc
  }, {})

const toCsv = (headers, rows) => {
  const escape = (value) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return `${lines.join('\n')}\n`
}

class ReportService {
  async getDashboard(societyId, query = {}) {
    const { from, to } = parseDateRange(query)

    const [
      occupancy,
      billing,
      complaints,
      visitors,
      maintenance,
      parking,
    ] = await Promise.all([
      this.getOccupancy(societyId),
      this.getBilling(societyId, { from, to }),
      this.getComplaints(societyId, { from, to }),
      this.getVisitors(societyId, { from, to }),
      this.getMaintenance(societyId, { from, to }),
      this.getParking(societyId),
    ])

    return {
      societyId,
      range: { from, to },
      summary: {
        flats: occupancy.totals,
        billing: billing.totals,
        complaints: complaints.totals,
        visitors: visitors.totals,
        maintenance: maintenance.totals,
        parking: parking.totals,
      },
      occupancy,
      billing,
      complaints,
      visitors,
      maintenance,
      parking,
    }
  }

  async getOccupancy(societyId) {
    const society = toObjectId(societyId)
    const [byStatus, totalFlats, totalMembers, activeMembers] = await Promise.all([
      Flat.aggregate([
        { $match: { society, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Flat.countDocuments({ society, isDeleted: false }),
      Member.countDocuments({ society, isDeleted: false }),
      Member.countDocuments({ society, isDeleted: false, isActive: true }),
    ])

    const statusCounts = groupCounts(byStatus)
    const occupied = statusCounts[FLAT_STATUS.OCCUPIED] || 0
    const vacant = statusCounts[FLAT_STATUS.VACANT] || 0
    const underMaintenance = statusCounts[FLAT_STATUS.UNDER_MAINTENANCE] || 0
    const occupancyRate = totalFlats > 0 ? Number(((occupied / totalFlats) * 100).toFixed(2)) : 0

    return {
      totals: {
        flats: totalFlats,
        occupied,
        vacant,
        underMaintenance,
        occupancyRate,
        members: totalMembers,
        activeMembers,
      },
      byStatus: statusCounts,
    }
  }

  async getBilling(societyId, query = {}) {
    const { from, to } = query.from !== undefined ? query : parseDateRange(query)
    const society = toObjectId(societyId)
    const invoiceDate = dateMatch('createdAt', from, to)
    const paymentDate = dateMatch('paidAt', from, to)

    const [invoiceByStatus, paymentAgg, invoiceTotals, overdueCount] = await Promise.all([
      Invoice.aggregate([
        { $match: { society, isDeleted: false, ...invoiceDate } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            amountPaid: { $sum: '$amountPaid' },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            society,
            isDeleted: false,
            status: PAYMENT_STATUS.SUCCESS,
            ...paymentDate,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            collected: { $sum: '$amount' },
          },
        },
      ]),
      Invoice.aggregate([
        { $match: { society, isDeleted: false, ...invoiceDate } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            billed: { $sum: '$totalAmount' },
            paid: { $sum: '$amountPaid' },
          },
        },
      ]),
      Invoice.countDocuments({
        society,
        isDeleted: false,
        status: { $in: [INVOICE_STATUS.OVERDUE, INVOICE_STATUS.ISSUED, INVOICE_STATUS.PARTIALLY_PAID] },
        dueDate: { $lt: new Date() },
        ...invoiceDate,
      }),
    ])

    const totalsRow = invoiceTotals[0] || { count: 0, billed: 0, paid: 0 }
    const paymentRow = paymentAgg[0] || { count: 0, collected: 0 }

    return {
      totals: {
        invoices: totalsRow.count,
        billed: totalsRow.billed || 0,
        amountPaid: totalsRow.paid || 0,
        outstanding: Math.max(0, (totalsRow.billed || 0) - (totalsRow.paid || 0)),
        collections: paymentRow.collected || 0,
        successfulPayments: paymentRow.count || 0,
        overdueInvoices: overdueCount,
      },
      invoicesByStatus: invoiceByStatus.map((row) => ({
        status: row._id,
        count: row.count,
        totalAmount: row.totalAmount || 0,
        amountPaid: row.amountPaid || 0,
      })),
      range: { from, to },
    }
  }

  async getComplaints(societyId, query = {}) {
    const { from, to } = query.from !== undefined ? query : parseDateRange(query)
    const society = toObjectId(societyId)
    const created = dateMatch('createdAt', from, to)

    const [byStatus, byPriority, total] = await Promise.all([
      Complaint.aggregate([
        { $match: { society, isDeleted: false, ...created } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { society, isDeleted: false, ...created } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Complaint.countDocuments({ society, isDeleted: false, ...created }),
    ])

    const statusCounts = groupCounts(byStatus)
    const open =
      (statusCounts[COMPLAINT_STATUS.OPEN] || 0) +
      (statusCounts[COMPLAINT_STATUS.IN_PROGRESS] || 0)

    return {
      totals: {
        total,
        open,
        resolved: statusCounts[COMPLAINT_STATUS.RESOLVED] || 0,
        closed: statusCounts[COMPLAINT_STATUS.CLOSED] || 0,
      },
      byStatus: statusCounts,
      byPriority: groupCounts(byPriority),
      range: { from, to },
    }
  }

  async getVisitors(societyId, query = {}) {
    const { from, to } = query.from !== undefined ? query : parseDateRange(query)
    const society = toObjectId(societyId)
    const created = dateMatch('createdAt', from, to)

    const [byStatus, total] = await Promise.all([
      Visitor.aggregate([
        { $match: { society, isDeleted: false, ...created } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Visitor.countDocuments({ society, isDeleted: false, ...created }),
    ])

    const statusCounts = groupCounts(byStatus)

    return {
      totals: {
        total,
        checkedIn: statusCounts[VISITOR_STATUS.CHECKED_IN] || 0,
        checkedOut: statusCounts[VISITOR_STATUS.CHECKED_OUT] || 0,
        expected: statusCounts[VISITOR_STATUS.EXPECTED] || 0,
      },
      byStatus: statusCounts,
      range: { from, to },
    }
  }

  async getMaintenance(societyId, query = {}) {
    const { from, to } = query.from !== undefined ? query : parseDateRange(query)
    const society = toObjectId(societyId)
    const created = dateMatch('createdAt', from, to)

    const [byStatus, costAgg, total] = await Promise.all([
      Maintenance.aggregate([
        { $match: { society, isDeleted: false, ...created } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Maintenance.aggregate([
        { $match: { society, isDeleted: false, ...created } },
        {
          $group: {
            _id: null,
            estimatedCost: { $sum: '$estimatedCost' },
            actualCost: { $sum: '$actualCost' },
          },
        },
      ]),
      Maintenance.countDocuments({ society, isDeleted: false, ...created }),
    ])

    const statusCounts = groupCounts(byStatus)
    const costs = costAgg[0] || { estimatedCost: 0, actualCost: 0 }

    return {
      totals: {
        total,
        open: statusCounts[MAINTENANCE_STATUS.OPEN] || 0,
        inProgress: statusCounts[MAINTENANCE_STATUS.IN_PROGRESS] || 0,
        completed: statusCounts[MAINTENANCE_STATUS.COMPLETED] || 0,
        estimatedCost: costs.estimatedCost || 0,
        actualCost: costs.actualCost || 0,
      },
      byStatus: statusCounts,
      range: { from, to },
    }
  }

  async getParking(societyId) {
    const society = toObjectId(societyId)

    const [byStatus, byType, totalSlots, totalVehicles, assignedVehicles] = await Promise.all([
      Parking.aggregate([
        { $match: { society, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Parking.aggregate([
        { $match: { society, isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Parking.countDocuments({ society, isDeleted: false }),
      Vehicle.countDocuments({ society, isDeleted: false }),
      Vehicle.countDocuments({ society, isDeleted: false, parking: { $ne: null } }),
    ])

    const statusCounts = groupCounts(byStatus)
    const available = statusCounts[PARKING_STATUS.AVAILABLE] || 0
    const occupied = statusCounts[PARKING_STATUS.OCCUPIED] || 0
    const utilizationRate =
      totalSlots > 0 ? Number(((occupied / totalSlots) * 100).toFixed(2)) : 0

    return {
      totals: {
        slots: totalSlots,
        available,
        occupied,
        reserved: statusCounts[PARKING_STATUS.RESERVED] || 0,
        blocked: statusCounts[PARKING_STATUS.BLOCKED] || 0,
        utilizationRate,
        vehicles: totalVehicles,
        assignedVehicles,
      },
      byStatus: statusCounts,
      byType: groupCounts(byType),
    }
  }

  async exportReport(societyId, query = {}) {
    const type = (query.type || 'dashboard').toLowerCase()
    const format = (query.format || 'json').toLowerCase()

    let data
    switch (type) {
      case 'occupancy':
        data = await this.getOccupancy(societyId)
        break
      case 'billing':
        data = await this.getBilling(societyId, query)
        break
      case 'complaints':
        data = await this.getComplaints(societyId, query)
        break
      case 'visitors':
        data = await this.getVisitors(societyId, query)
        break
      case 'maintenance':
        data = await this.getMaintenance(societyId, query)
        break
      case 'parking':
        data = await this.getParking(societyId)
        break
      case 'dashboard':
      default:
        data = await this.getDashboard(societyId, query)
        break
    }

    if (format === 'csv') {
      return {
        format: 'csv',
        filename: `society-${type}-report.csv`,
        contentType: 'text/csv',
        body: this.#toCsvExport(type, data),
      }
    }

    return {
      format: 'json',
      filename: `society-${type}-report.json`,
      contentType: 'application/json',
      body: data,
    }
  }

  #toCsvExport(type, data) {
    if (type === 'billing' && data.invoicesByStatus) {
      return toCsv(
        ['status', 'count', 'totalAmount', 'amountPaid'],
        data.invoicesByStatus.map((row) => ({
          status: row.status,
          count: row.count,
          totalAmount: row.totalAmount,
          amountPaid: row.amountPaid,
        })),
      )
    }

    const totals = data.totals || data.summary || {}
    const rows = Object.entries(totals).map(([key, value]) => {
      if (value && typeof value === 'object') {
        return { metric: key, value: JSON.stringify(value) }
      }
      return { metric: key, value }
    })
    return toCsv(['metric', 'value'], rows)
  }
}

export default new ReportService()
