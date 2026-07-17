import rolePolicyRepository from '../repositories/rolePolicy.repository.js'
import activityLogRepository from '../repositories/activityLog.repository.js'
import {
  ACTIVITY_ACTION,
  DEFAULT_ROLE_PERMISSIONS,
  HTTP_STATUS,
  MANAGEABLE_ROLES,
  MEMBER_OVERRIDABLE_PERMISSIONS,
  PERMISSION_CATALOG,
  PERMISSION_VALUES,
  ROLES,
  computeEffectivePermissions,
} from '../constants/index.js'
import ApiError from '../utils/ApiError.js'

class RoleService {
  async getPermissionCatalog() {
    return {
      permissions: PERMISSION_CATALOG,
      total: PERMISSION_CATALOG.length,
    }
  }

  async listRoles(societyId) {
    const policies = await rolePolicyRepository.listBySociety(societyId)
    const policyByRole = Object.fromEntries(policies.map((p) => [p.role, p]))

    const roles = MANAGEABLE_ROLES.map((role) => {
      const override = policyByRole[role]
      const effective = computeEffectivePermissions(role, override)
      return {
        role,
        defaultPermissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
        grants: override?.grants || [],
        denies: override?.denies || [],
        effectivePermissions: effective,
        overridable:
          role === ROLES.MEMBER ? MEMBER_OVERRIDABLE_PERMISSIONS : [],
      }
    })

    return {
      roles,
      note: 'SUPER_ADMIN is platform-scoped and not manageable at society level',
    }
  }

  async getRole(societyId, role) {
    if (role === ROLES.SUPER_ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'SUPER_ADMIN role is not society-manageable')
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid role')
    }

    const override = await rolePolicyRepository.findBySocietyAndRole(societyId, role)
    return {
      role,
      defaultPermissions: DEFAULT_ROLE_PERMISSIONS[role] || [],
      grants: override?.grants || [],
      denies: override?.denies || [],
      effectivePermissions: computeEffectivePermissions(role, override),
      overridable: role === ROLES.MEMBER ? MEMBER_OVERRIDABLE_PERMISSIONS : [],
    }
  }

  async updateRolePolicy(societyId, role, payload, actor, meta = {}) {
    if (role === ROLES.SUPER_ADMIN) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Cannot modify SUPER_ADMIN permissions')
    }
    if (role !== ROLES.MEMBER) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Society admins may only override MEMBER role permissions',
      )
    }

    const grants = [...new Set(payload.grants || [])]
    const denies = [...new Set(payload.denies || [])]

    for (const perm of [...grants, ...denies]) {
      if (!PERMISSION_VALUES.includes(perm)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Unknown permission: ${perm}`)
      }
      if (!MEMBER_OVERRIDABLE_PERMISSIONS.includes(perm)) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Permission ${perm} cannot be overridden for MEMBER`,
        )
      }
    }

    const overlap = grants.filter((g) => denies.includes(g))
    if (overlap.length) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Permission cannot be both granted and denied: ${overlap.join(', ')}`,
      )
    }

    const policy = await rolePolicyRepository.upsert(societyId, role, {
      grants,
      denies,
      updatedBy: actor.id,
    })

    await activityLogRepository.log({
      society: societyId,
      user: actor.id,
      action: ACTIVITY_ACTION.UPDATE,
      entityType: 'RolePolicy',
      entityId: policy._id,
      description: `Role policy updated for ${role}`,
      metadata: { grants, denies },
      ip: meta.ip,
      userAgent: meta.userAgent,
    })

    return this.getRole(societyId, role)
  }

  async getEffectivePermissions(user, societyId = null) {
    let override = null
    const sid = societyId || user.society
    if (sid && user.role !== ROLES.SUPER_ADMIN) {
      override = await rolePolicyRepository.findBySocietyAndRole(sid, user.role)
    }

    return {
      role: user.role,
      permissions: computeEffectivePermissions(user.role, override),
    }
  }
}

export default new RoleService()
