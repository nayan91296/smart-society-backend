import { ROLES } from './roles.js'
import { PERMISSIONS, PERMISSION_VALUES } from './permissions.js'

const ALL_ADMIN_PERMISSIONS = PERMISSION_VALUES.filter(
  (p) =>
    ![
      PERMISSIONS.MEMBER_PORTAL,
      PERMISSIONS.MEMBER_VEHICLE_SELF,
      PERMISSIONS.MEMBER_PARKING_SELF,
    ].includes(p),
)

/** Default grants for fixed roles (before society overrides). */
export const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [...PERMISSION_VALUES],
  [ROLES.SOCIETY_ADMIN]: [...ALL_ADMIN_PERMISSIONS],
  [ROLES.MEMBER]: [
    PERMISSIONS.MEMBER_PORTAL,
    PERMISSIONS.MEMBER_VEHICLE_SELF,
    PERMISSIONS.MEMBER_PARKING_SELF,
    PERMISSIONS.NOTIFICATION_READ,
    PERMISSIONS.NOTICE_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.VISITOR_READ,
    PERMISSIONS.COMPLAINT_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.PAYMENT_READ,
  ],
}

/** Permissions society admins may grant/deny on the MEMBER role only. */
export const MEMBER_OVERRIDABLE_PERMISSIONS = [
  PERMISSIONS.MEMBER_VEHICLE_SELF,
  PERMISSIONS.MEMBER_PARKING_SELF,
  PERMISSIONS.NOTIFICATION_READ,
  PERMISSIONS.NOTICE_READ,
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.DOCUMENT_READ,
  PERMISSIONS.VISITOR_READ,
  PERMISSIONS.COMPLAINT_READ,
  PERMISSIONS.INVOICE_READ,
  PERMISSIONS.PAYMENT_READ,
]

/** Roles that society admins may inspect/manage (never SUPER_ADMIN). */
export const MANAGEABLE_ROLES = [ROLES.SOCIETY_ADMIN, ROLES.MEMBER]

export const computeEffectivePermissions = (role, override = null) => {
  const base = new Set(DEFAULT_ROLE_PERMISSIONS[role] || [])

  if (role === ROLES.SUPER_ADMIN) {
    return [...base]
  }

  if (override) {
    for (const grant of override.grants || []) {
      if (PERMISSION_VALUES.includes(grant)) base.add(grant)
    }
    for (const deny of override.denies || []) {
      base.delete(deny)
    }
  }

  return [...base]
}

export const hasPermission = (effectivePermissions, permission) => {
  if (!permission) return true
  return Array.isArray(effectivePermissions) && effectivePermissions.includes(permission)
}
