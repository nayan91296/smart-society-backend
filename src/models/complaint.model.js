import mongoose from 'mongoose'
import { COMPLAINT_PRIORITY, COMPLAINT_STATUS } from '../constants/enums.js'
import { attachmentSchema, baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const complaintSchema = new mongoose.Schema(
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
      index: true,
    },
    raisedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    raisedByMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.OPEN,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      index: true,
    },
    attachments: [attachmentSchema],
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

complaintSchema.index({ society: 1, ticketNumber: 1 }, { unique: true })
complaintSchema.index({ society: 1, status: 1, priority: 1, createdAt: -1 })
complaintSchema.index({ society: 1, flat: 1, status: 1 })

const Complaint = mongoose.model('Complaint', complaintSchema)

export default Complaint
