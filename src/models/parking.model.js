import mongoose from 'mongoose'
import { PARKING_STATUS, PARKING_TYPE } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const parkingSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    slotNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    wing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wing',
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(PARKING_TYPE),
      default: PARKING_TYPE.OPEN,
    },
    status: {
      type: String,
      enum: Object.values(PARKING_STATUS),
      default: PARKING_STATUS.AVAILABLE,
      index: true,
    },
    assignedFlat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flat',
      default: null,
      index: true,
    },
    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

parkingSchema.index({ society: 1, slotNumber: 1 }, { unique: true })
parkingSchema.index({ society: 1, status: 1, isDeleted: 1 })

const Parking = mongoose.model('Parking', parkingSchema)

export default Parking
