export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  WAREHOUSE_STAFF: 'warehouse_staff',
  CONTENT_EDITOR: 'content_editor',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Quản trị cấp cao',
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.WAREHOUSE_STAFF]: 'Nhân viên kho',
  [ROLES.CONTENT_EDITOR]: 'Biên tập viên nội dung',
  [ROLES.CUSTOMER]: 'Khách hàng',
}

export const ROLE_GROUPS = {
  adminPanel: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.CONTENT_EDITOR],
  fullAdmin: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  superOnly: [ROLES.SUPER_ADMIN],
  productView: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF, ROLES.CONTENT_EDITOR],
  productManage: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONTENT_EDITOR],
  contentManage: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CONTENT_EDITOR],
  warehouseManage: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF],
  orderManage: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.WAREHOUSE_STAFF],
}

export const hasRole = (user, roles) => roles.includes(user?.role)
