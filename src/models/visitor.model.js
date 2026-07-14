import mongoose from 'mongoose'
import { VISITOR_STATUS } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const visitorSchema = new mongoose.Schema(
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
    hostMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    expectedAt: {
      type: Date,
    },
    entryAt: {
      type: Date,
    },
    exitAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(VISITOR_STATUS),
      default: VISITOR_STATUS.EXPECTED,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guard',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

visitorSchema.index({ society: 1, status: 1, createdAt: -1 })
visitorSchema.index({ society: 1, flat: 1, status: 1 })
visitorSchema.index({ phone: 1, society: 1 })

const Visitor = mongoose.model('Visitor', visitorSchema)

export default Visitor
