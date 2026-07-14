import mongoose from 'mongoose'
import { EVENT_STATUS } from '../constants/enums.js'
import { attachmentSchema, baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const eventSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
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
      maxlength: 5000,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      index: true,
    },
    maxAttendees: {
      type: Number,
      min: 0,
    },
    attendees: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        registeredAt: { type: Date, default: Date.now },
      },
    ],
    coverImageUrl: {
      type: String,
      trim: true,
    },
    attachments: [attachmentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

eventSchema.index({ society: 1, status: 1, startAt: 1 })
eventSchema.index({ society: 1, isDeleted: 1, startAt: -1 })

const Event = mongoose.model('Event', eventSchema)

export default Event
