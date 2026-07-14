import mongoose from 'mongoose'
import { MEMBER_RELATION, OWNERSHIP_TYPE } from '../constants/enums.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const memberSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
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
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    ownershipType: {
      type: String,
      enum: Object.values(OWNERSHIP_TYPE),
      default: OWNERSHIP_TYPE.OWNER,
    },
    relation: {
      type: String,
      enum: Object.values(MEMBER_RELATION),
      default: MEMBER_RELATION.SELF,
    },
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    moveInDate: {
      type: Date,
    },
    moveOutDate: {
      type: Date,
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

memberSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`
})

memberSchema.index({ society: 1, flat: 1, isDeleted: 1 })
memberSchema.index({ society: 1, email: 1 })
memberSchema.index(
  { flat: 1, isPrimary: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimary: true, isDeleted: false },
  },
)

const Member = mongoose.model('Member', memberSchema)

export default Member
