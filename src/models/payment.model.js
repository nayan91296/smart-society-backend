import mongoose from 'mongoose'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const paymentSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
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
    paymentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.UPI,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

paymentSchema.index({ society: 1, paymentNumber: 1 }, { unique: true })
paymentSchema.index({ society: 1, status: 1, paidAt: -1 })
paymentSchema.index({ invoice: 1, status: 1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
