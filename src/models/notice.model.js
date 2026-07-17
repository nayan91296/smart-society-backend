import mongoose from 'mongoose'
import { NOTICE_AUDIENCE, NOTICE_PRIORITY, NOTICE_STATUS } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const noticeSchema = new mongoose.Schema(
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
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    priority: {
      type: String,
      enum: Object.values(NOTICE_PRIORITY),
      default: NOTICE_PRIORITY.NORMAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTICE_STATUS),
      default: NOTICE_STATUS.DRAFT,
      index: true,
    },
    audience: {
      type: String,
      enum: Object.values(NOTICE_AUDIENCE),
      default: NOTICE_AUDIENCE.SOCIETY,
      index: true,
    },
    wing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wing',
      default: null,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      default: null,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
    },
    publishAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

noticeSchema.index({ society: 1, status: 1, publishAt: -1 })
noticeSchema.index({ society: 1, audience: 1, isDeleted: 1 })
noticeSchema.index({ society: 1, isPinned: -1, publishAt: -1 })
noticeSchema.index({ society: 1, wing: 1, status: 1 })
noticeSchema.index({ society: 1, floor: 1, status: 1 })
noticeSchema.index({ society: 1, flat: 1, status: 1 })

const Notice = mongoose.model('Notice', noticeSchema)

export default Notice
