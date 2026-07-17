import mongoose from 'mongoose'
import { VEHICLE_TYPE } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const vehicleSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      index: true,
    },
    parking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parking',
      default: null,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    type: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
      default: VEHICLE_TYPE.FOUR_WHEELER,
    },
    make: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    model: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    color: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

vehicleSchema.index(
  { society: 1, vehicleNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
)
vehicleSchema.index({ society: 1, flat: 1, isDeleted: 1 })
vehicleSchema.index({ society: 1, member: 1, isDeleted: 1 })
vehicleSchema.index(
  { parking: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false, parking: { $type: 'objectId' } },
  },
)

const Vehicle = mongoose.model('Vehicle', vehicleSchema)

export default Vehicle
