import mongoose from 'mongoose'
import { EMERGENCY_CONTACT_TYPE } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const emergencyContactSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(EMERGENCY_CONTACT_TYPE),
      default: EMERGENCY_CONTACT_TYPE.CUSTOM,
      index: true,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isPrimary: {
      type: Boolean,
      default: false,
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

emergencyContactSchema.index({ society: 1, type: 1, isDeleted: 1 })
emergencyContactSchema.index({ society: 1, member: 1, isDeleted: 1 })

const EmergencyContact = mongoose.model('EmergencyContact', emergencyContactSchema)

export default EmergencyContact
