import 'server-only'
import Admin from '@/server/models/Admin'
import Role from '@/server/models/Role'
import {permissionsFromRows, type RolePermissions} from '@/lib/admin/access'

function assertPermissionSubset(actor: RolePermissions, requested: RolePermissions) {
  for (const [resource, actions] of Object.entries(requested)) {
    const allowed = actor[resource as keyof RolePermissions] ?? []
    if (actions.some(action => !allowed.includes(action))) {
      throw new Error('You cannot manage or grant permissions that your account does not have.')
    }
  }
}

export async function assertAccessChange(actorId: number, target: {adminId?: number; roleId?: number}, permissions?: RolePermissions) {
  const actor = await Admin.where('id', actorId).firstJson()
  if (!actor) throw new Error('Your admin account no longer exists.')
  const primary = await Admin.where('is_primary_admin', true).firstJson()
  const isPrimary = primary && Number(primary.id) === actorId
  if (!isPrimary && primary && (target.adminId === Number(primary.id) || target.roleId === Number(primary.role_id))) {
    throw new Error('Only the first Super admin can modify this account or its role.')
  }
  if (isPrimary) return
  const actorRole = actor.role_id == null ? null : await Role.with('permissions').where('id', Number(actor.role_id)).firstJson()
  const allowed = permissionsFromRows(actorRole?.permissions ?? [])
  if (permissions) assertPermissionSubset(allowed, permissions)
  if (target.adminId) {
    const admin = await Admin.where('id', target.adminId).firstJson()
    if (!admin) throw new Error('Admin not found.')
    if (admin.role_id == null) throw new Error('Only the first Super admin can manage an owner account.')
    const role = await Role.with('permissions').where('id', Number(admin.role_id)).firstJson()
    assertPermissionSubset(allowed, permissionsFromRows(role?.permissions ?? []))
  }
  if (target.roleId) {
    const role = await Role.with('permissions').where('id', target.roleId).firstJson()
    if (!role) throw new Error('Role not found.')
    assertPermissionSubset(allowed, permissionsFromRows(role.permissions))
  }
}
