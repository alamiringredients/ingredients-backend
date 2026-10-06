import 'server-only'
import Admin from '@/server/models/Admin'
import Role from '@/server/models/Role'
import {permissionsFromRows, type RolePermissions} from '@/lib/admin/access'

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

export async function getAdminEditorData(id?: number) {
  const [admin, roles] = await Promise.all([
    id ? Admin.where('id', id).select('id', 'name', 'email', 'role_id').firstJson() : null,
    Role.select('id', 'name').orderBy('name').getJson(),
  ])
  return {
    initialAdmin: admin ? {id: Number(admin.id), name: String(admin.name), email: String(admin.email), role_id: admin.role_id == null ? null : Number(admin.role_id)} : null,
    roles: roles.map(role => ({id: Number(role.id), name: String(role.name)})),
  }
}

export async function getRoleEditorData(id: number): Promise<RoleSummary | null> {
  const role = await Role.with('permissions').where('id', id).firstJson()
  return role ? {id: Number(role.id), name: String(role.name), description: String(role.description ?? ''), permissions: permissionsFromRows(role.permissions)} : null
}
