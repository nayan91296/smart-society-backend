import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES, ROLE_VALUES } from '../constants/roles.js'
import { PREFERRED_LANGUAGE, PREFERRED_LANGUAGE_VALUES } from '../constants/enums.js'
import { softDeleteFields } from './shared/common.schema.js'

const userSchema = new mongoose.Schema(
  {
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
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.SOCIETY_ADMIN,
      index: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
      index: true,
    },
    /** Super Admin only: last selected tenant context (client should still send X-Society-Id). */
    activeSocietyContext: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Society',
      default: null,
    },
    /** Wing assigned when role is WING_SECRETARY (exactly one secretary per wing). */
    managedWing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wing',
      default: null,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: PREFERRED_LANGUAGE_VALUES,
      default: PREFERRED_LANGUAGE.EN,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    notificationPreferences: {
      channels: {
        inApp: {
          enabled: { type: Boolean, default: true },
        },
        email: {
          enabled: { type: Boolean, default: true },
        },
        push: {
          enabled: { type: Boolean, default: false },
        },
        whatsapp: {
          enabled: { type: Boolean, default: false },
        },
      },
      mutedTypes: {
        type: [String],
        default: [],
      },
    },
    ...softDeleteFields,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password
        delete ret.passwordResetToken
        delete ret.passwordResetExpires
        delete ret.__v
        return ret
      },
    },
    toObject: {
      virtuals: true,
    },
  },
)

userSchema.pre('validate', function validateManagedWing() {
  if (this.role === ROLES.WING_SECRETARY) {
    if (!this.managedWing) {
      this.invalidate('managedWing', 'managedWing is required for WING_SECRETARY')
    }
  } else if (this.managedWing) {
    this.invalidate('managedWing', 'managedWing is only allowed for WING_SECRETARY')
  }
})

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.virtual('fullName').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`
})

userSchema.index({ society: 1, role: 1, isDeleted: 1 })

/** At most one active Wing Secretary per wing. */
userSchema.index(
  { managedWing: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: ROLES.WING_SECRETARY,
      managedWing: { $type: 'objectId' },
      isDeleted: false,
    },
  },
)

const User = mongoose.model('User', userSchema)

export default User
