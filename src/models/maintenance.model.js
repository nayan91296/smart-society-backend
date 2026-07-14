import mongoose from 'mongoose'
import { COMPLAINT_PRIORITY, MAINTENANCE_STATUS } from '../constants/enums.js'
import { attachmentSchema, baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const maintenanceSchema = new mongoose.Schema(
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
    workOrderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: COMPLAINT_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.OPEN,
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    estimatedCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualCost: {
      type: Number,
      min: 0,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedComplaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    attachments: [attachmentSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

maintenanceSchema.index({ society: 1, workOrderNumber: 1 }, { unique: true })
maintenanceSchema.index({ society: 1, status: 1, scheduledAt: 1 })
maintenanceSchema.index({ society: 1, flat: 1, status: 1 })

const Maintenance = mongoose.model('Maintenance', maintenanceSchema)

export default Maintenance
