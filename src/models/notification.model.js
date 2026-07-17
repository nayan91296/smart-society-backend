import mongoose from 'mongoose'
import {
  DELIVERY_STATUS,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_TYPE,
} from '../constants/enums.js'
import { baseSchemaOptions } from './shared/common.schema.js'

const deliverySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNEL),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.PENDING,
    },
    attemptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false },
)

const notificationSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.INFO,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    entityType: {
      type: String,
      trim: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    channels: {
      type: [
        {
          type: String,
          enum: Object.values(NOTIFICATION_CHANNEL),
        },
      ],
      default: [NOTIFICATION_CHANNEL.IN_APP],
    },
    deliveries: {
      type: [deliverySchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  baseSchemaOptions,
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ society: 1, createdAt: -1 })
notificationSchema.index({ user: 1, type: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
