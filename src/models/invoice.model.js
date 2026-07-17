import mongoose from 'mongoose'
import { INVOICE_STATUS, INVOICE_TYPE } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 1 },
    unitPrice: { type: Number, min: 0, required: true },
    amount: { type: Number, min: 0, required: true },
  },
  { _id: false },
)

const invoiceSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: Object.values(INVOICE_TYPE),
      default: INVOICE_TYPE.MAINTENANCE,
      index: true,
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      min: 0,
      required: true,
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },
    amountPaid: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.DRAFT,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

invoiceSchema.virtual('balanceDue').get(function getBalanceDue() {
  return Math.max(0, (this.totalAmount || 0) - (this.amountPaid || 0))
})

invoiceSchema.index({ society: 1, invoiceNumber: 1 }, { unique: true })
invoiceSchema.index({ society: 1, status: 1, dueDate: 1 })
invoiceSchema.index({ society: 1, flat: 1, status: 1 })
invoiceSchema.index({ member: 1, status: 1 })
invoiceSchema.index(
  { society: 1, flat: 1, type: 1, periodStart: 1, periodEnd: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      status: { $nin: [INVOICE_STATUS.CANCELLED] },
      periodStart: { $type: 'date' },
      periodEnd: { $type: 'date' },
    },
  },
)

const Invoice = mongoose.model('Invoice', invoiceSchema)

export default Invoice
