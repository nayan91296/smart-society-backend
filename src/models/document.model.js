import mongoose from 'mongoose'
import { DOCUMENT_VISIBILITY } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const documentSchema = new mongoose.Schema(
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
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      trim: true,
      index: true,
    },
    mimeType: {
      type: String,
      trim: true,
    },
    size: {
      type: Number,
      min: 0,
    },
    visibility: {
      type: String,
      enum: Object.values(DOCUMENT_VISIBILITY),
      default: DOCUMENT_VISIBILITY.SOCIETY,
      index: true,
    },
    wing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wing',
      default: null,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedForMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

documentSchema.index({ society: 1, category: 1, createdAt: -1 })
documentSchema.index({ society: 1, visibility: 1, isDeleted: 1 })
documentSchema.index({ society: 1, wing: 1, visibility: 1 })
documentSchema.index({ society: 1, flat: 1, visibility: 1 })

const Document = mongoose.model('Document', documentSchema)

export default Document
