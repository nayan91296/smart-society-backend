import mongoose from 'mongoose'
import { ACTIVITY_ACTION } from '../constants/enums.js'
import { baseSchemaOptions } from './shared/common.schema.js'

const activityLogSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(ACTIVITY_ACTION),
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    ...baseSchemaOptions,
    timestamps: { createdAt: true, updatedAt: false },
  },
)

activityLogSchema.index({ society: 1, createdAt: -1 })
activityLogSchema.index({ user: 1, createdAt: -1 })
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
