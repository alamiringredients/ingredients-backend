import Admin from '@/server/models/Admin'
import Role from '@/server/models/Role'
import {normalizeRolePermissions, type RolePermissions} from '@/lib/admin/access'

export type AdminSummary = {
  id: number
  name: string
  email: string
  role_id: number | null
}

export type RoleSummary = {
  id: number
  name: string
  description: string
  permissions: RolePermissions
}

export async function getAccessManagementData() {
  const [adminRows, roleRows] = await Promise.all([
    Admin.orderBy('name').getJson(),
    Role.orderBy('name').getJson(),
  ])

  return {
    admins: adminRows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      email: String(row.email),
      role_id: row.role_id == null ? null : Number(row.role_id),
    })),
    roles: roleRows.map((row) => ({
      id: Number(row.id),
      name: String(row.name),
      description: String(row.description ?? ''),
      permissions: normalizeRolePermissions(row.permissions),
    })),
  }
}
