import mongoose from 'mongoose'
import { SOCIETY_STATUS } from '../constants/enums.js'
import { addressSchema, baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    registrationNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: addressSchema,
    logoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SOCIETY_STATUS),
      default: SOCIETY_STATUS.ACTIVE,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    settings: {
      timezone: { type: String, default: 'Asia/Kolkata' },
      currency: { type: String, default: 'INR' },
      maintenanceDueDay: { type: Number, min: 1, max: 28, default: 5 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

societySchema.index({ name: 1 })
societySchema.index({ status: 1, isDeleted: 1 })

const Society = mongoose.model('Society', societySchema)

export default Society
