import mongoose from 'mongoose'
import { SUPPORT_TICKET_PRIORITY, SUPPORT_TICKET_STATUS } from '../constants/enums.js'
import { attachmentSchema, baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachments: [attachmentSchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
)

const supportTicketSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_PRIORITY),
      default: SUPPORT_TICKET_PRIORITY.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SUPPORT_TICKET_STATUS),
      default: SUPPORT_TICKET_STATUS.OPEN,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    messages: {
      type: [ticketMessageSchema],
      default: [],
    },
    attachments: [attachmentSchema],
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

supportTicketSchema.index({ society: 1, status: 1, priority: 1, createdAt: -1 })
supportTicketSchema.index({ createdBy: 1, status: 1 })

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema)

export default SupportTicket
