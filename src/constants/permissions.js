/**
 * Permission catalog for the fixed-role system.
 * Roles map to default grants; society overrides may grant/deny within this set.
 */
export const PERMISSIONS = {
  // Society structure
  SOCIETY_READ: 'society:read',
  SOCIETY_UPDATE: 'society:update',
  SOCIETY_SETTINGS_READ: 'society:settings:read',
  SOCIETY_SETTINGS_UPDATE: 'society:settings:update',

  WING_READ: 'wing:read',
  WING_MANAGE: 'wing:manage',
  FLOOR_READ: 'floor:read',
  FLOOR_MANAGE: 'floor:manage',
  FLAT_READ: 'flat:read',
  FLAT_MANAGE: 'flat:manage',

  MEMBER_READ: 'member:read',
  MEMBER_MANAGE: 'member:manage',
  USER_READ: 'user:read',
  USER_MANAGE: 'user:manage',

  VISITOR_READ: 'visitor:read',
  VISITOR_MANAGE: 'visitor:manage',
  COMPLAINT_READ: 'complaint:read',
  COMPLAINT_MANAGE: 'complaint:manage',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_MANAGE: 'maintenance:manage',

  INVOICE_READ: 'invoice:read',
  INVOICE_MANAGE: 'invoice:manage',
  PAYMENT_READ: 'payment:read',
  PAYMENT_MANAGE: 'payment:manage',

  NOTICE_READ: 'notice:read',
  NOTICE_MANAGE: 'notice:manage',
  EVENT_READ: 'event:read',
  EVENT_MANAGE: 'event:manage',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_MANAGE: 'document:manage',

  PARKING_READ: 'parking:read',
  PARKING_MANAGE: 'parking:manage',
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_MANAGE: 'vehicle:manage',

  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',

  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_SEND: 'notification:send',
  NOTIFICATION_BROADCAST: 'notification:broadcast',

  ROLE_READ: 'role:read',
  ROLE_MANAGE: 'role:manage',
  PERMISSION_READ: 'permission:read',

  // Member self-service
  MEMBER_PORTAL: 'member:portal',
  MEMBER_VEHICLE_SELF: 'member:vehicle:self',
  MEMBER_PARKING_SELF: 'member:parking:self',
}

export const PERMISSION_VALUES = Object.values(PERMISSIONS)

export const PERMISSION_CATALOG = [
  { key: PERMISSIONS.SOCIETY_READ, label: 'View society', group: 'Society' },
  { key: PERMISSIONS.SOCIETY_UPDATE, label: 'Update society profile', group: 'Society' },
  { key: PERMISSIONS.SOCIETY_SETTINGS_READ, label: 'View society settings', group: 'Settings' },
  { key: PERMISSIONS.SOCIETY_SETTINGS_UPDATE, label: 'Update society settings', group: 'Settings' },
  { key: PERMISSIONS.WING_READ, label: 'View wings', group: 'Structure' },
  { key: PERMISSIONS.WING_MANAGE, label: 'Manage wings', group: 'Structure' },
  { key: PERMISSIONS.FLOOR_READ, label: 'View floors', group: 'Structure' },
  { key: PERMISSIONS.FLOOR_MANAGE, label: 'Manage floors', group: 'Structure' },
  { key: PERMISSIONS.FLAT_READ, label: 'View flats', group: 'Structure' },
  { key: PERMISSIONS.FLAT_MANAGE, label: 'Manage flats', group: 'Structure' },
  { key: PERMISSIONS.MEMBER_READ, label: 'View members', group: 'People' },
  { key: PERMISSIONS.MEMBER_MANAGE, label: 'Manage members', group: 'People' },
  { key: PERMISSIONS.USER_READ, label: 'View users', group: 'People' },
  { key: PERMISSIONS.USER_MANAGE, label: 'Manage users', group: 'People' },
  { key: PERMISSIONS.VISITOR_READ, label: 'View visitors', group: 'Operations' },
  { key: PERMISSIONS.VISITOR_MANAGE, label: 'Manage visitors', group: 'Operations' },
  { key: PERMISSIONS.COMPLAINT_READ, label: 'View complaints', group: 'Operations' },
  { key: PERMISSIONS.COMPLAINT_MANAGE, label: 'Manage complaints', group: 'Operations' },
  { key: PERMISSIONS.MAINTENANCE_READ, label: 'View maintenance', group: 'Operations' },
  { key: PERMISSIONS.MAINTENANCE_MANAGE, label: 'Manage maintenance', group: 'Operations' },
  { key: PERMISSIONS.INVOICE_READ, label: 'View invoices', group: 'Billing' },
  { key: PERMISSIONS.INVOICE_MANAGE, label: 'Manage invoices', group: 'Billing' },
  { key: PERMISSIONS.PAYMENT_READ, label: 'View payments', group: 'Billing' },
  { key: PERMISSIONS.PAYMENT_MANAGE, label: 'Manage payments', group: 'Billing' },
  { key: PERMISSIONS.NOTICE_READ, label: 'View notices', group: 'Communication' },
  { key: PERMISSIONS.NOTICE_MANAGE, label: 'Manage notices', group: 'Communication' },
  { key: PERMISSIONS.EVENT_READ, label: 'View events', group: 'Communication' },
  { key: PERMISSIONS.EVENT_MANAGE, label: 'Manage events', group: 'Communication' },
  { key: PERMISSIONS.DOCUMENT_READ, label: 'View documents', group: 'Communication' },
  { key: PERMISSIONS.DOCUMENT_MANAGE, label: 'Manage documents', group: 'Communication' },
  { key: PERMISSIONS.PARKING_READ, label: 'View parking', group: 'Parking' },
  { key: PERMISSIONS.PARKING_MANAGE, label: 'Manage parking', group: 'Parking' },
  { key: PERMISSIONS.VEHICLE_READ, label: 'View vehicles', group: 'Parking' },
  { key: PERMISSIONS.VEHICLE_MANAGE, label: 'Manage vehicles', group: 'Parking' },
  { key: PERMISSIONS.REPORT_READ, label: 'View reports', group: 'Reports' },
  { key: PERMISSIONS.REPORT_EXPORT, label: 'Export reports', group: 'Reports' },
  { key: PERMISSIONS.NOTIFICATION_READ, label: 'View notifications', group: 'Notifications' },
  { key: PERMISSIONS.NOTIFICATION_SEND, label: 'Send notifications', group: 'Notifications' },
  { key: PERMISSIONS.NOTIFICATION_BROADCAST, label: 'Broadcast notifications', group: 'Notifications' },
  { key: PERMISSIONS.ROLE_READ, label: 'View roles', group: 'Access' },
  { key: PERMISSIONS.ROLE_MANAGE, label: 'Manage role policies', group: 'Access' },
  { key: PERMISSIONS.PERMISSION_READ, label: 'View permissions', group: 'Access' },
  { key: PERMISSIONS.MEMBER_PORTAL, label: 'Access member portal', group: 'Member' },
  { key: PERMISSIONS.MEMBER_VEHICLE_SELF, label: 'Manage own vehicles', group: 'Member' },
  { key: PERMISSIONS.MEMBER_PARKING_SELF, label: 'View own parking', group: 'Member' },
]
