import mongoose from 'mongoose'
import { FLAT_STATUS, FLAT_TYPES } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const flatSchema = new mongoose.Schema(
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
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
      index: true,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    type: {
      type: String,
      enum: Object.values(FLAT_TYPES),
      default: FLAT_TYPES.TWO_BHK,
    },
    areaSqFt: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(FLAT_STATUS),
      default: FLAT_STATUS.VACANT,
      index: true,
    },
    bedrooms: {
      type: Number,
      min: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

flatSchema.index({ society: 1, wing: 1, flatNumber: 1 }, { unique: true })
flatSchema.index({ society: 1, status: 1, isDeleted: 1 })
flatSchema.index({ floor: 1, isDeleted: 1 })

const Flat = mongoose.model('Flat', flatSchema)

export default Flat
