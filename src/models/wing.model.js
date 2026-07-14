import mongoose from 'mongoose'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const wingSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    totalFloors: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

wingSchema.index(
  { society: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
)
wingSchema.index({ society: 1, isDeleted: 1, isActive: 1 })

const Wing = mongoose.model('Wing', wingSchema)

export default Wing
