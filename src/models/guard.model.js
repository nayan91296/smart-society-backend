import mongoose from 'mongoose'
import { GUARD_SHIFT } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const guardSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      enum: Object.values(GUARD_SHIFT),
      default: GUARD_SHIFT.ROTATIONAL,
      index: true,
    },
    gateAssignment: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

guardSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`
})

guardSchema.index({ society: 1, employeeId: 1 }, { unique: true })
guardSchema.index({ society: 1, shift: 1, isActive: 1, isDeleted: 1 })

const Guard = mongoose.model('Guard', guardSchema)

export default Guard
