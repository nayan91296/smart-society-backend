import mongoose from 'mongoose'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const floorSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    wing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wing',
      required: true,
      index: true,
    },
    floorNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

floorSchema.index(
  { wing: 1, floorNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
)
floorSchema.index({ society: 1, wing: 1, isDeleted: 1 })

const Floor = mongoose.model('Floor', floorSchema)

export default Floor
