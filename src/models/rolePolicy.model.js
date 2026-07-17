import mongoose from 'mongoose'
import { MANAGEABLE_ROLES } from '../constants/rolePermissions.js'
import { PERMISSION_VALUES } from '../constants/permissions.js'
import { baseSchemaOptions, softDeleteFields } from './shared/common.schema.js'

const rolePolicySchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: MANAGEABLE_ROLES,
      required: true,
    },
    grants: {
      type: [
        {
          type: String,
          enum: PERMISSION_VALUES,
        },
      ],
      default: [],
    },
    denies: {
      type: [
        {
          type: String,
          enum: PERMISSION_VALUES,
        },
      ],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ...softDeleteFields,
  },
  baseSchemaOptions,
)

rolePolicySchema.index(
  { society: 1, role: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
)

const RolePolicy = mongoose.model('RolePolicy', rolePolicySchema)

export default RolePolicy
