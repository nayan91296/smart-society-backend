import mongoose from 'mongoose'
import { STAFF_DEPARTMENT } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const staffSchema = new mongoose.Schema(
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
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      enum: Object.values(STAFF_DEPARTMENT),
      default: STAFF_DEPARTMENT.OTHER,
      index: true,
    },
    joiningDate: {
      type: Date,
    },
    salary: {
      type: Number,
      min: 0,
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

staffSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`
})

staffSchema.index({ society: 1, employeeId: 1 }, { unique: true })
staffSchema.index({ society: 1, department: 1, isActive: 1, isDeleted: 1 })

const Staff = mongoose.model('Staff', staffSchema)

export default Staff
