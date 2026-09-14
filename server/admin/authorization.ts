import {getCurrentAdmin} from '@/server/admin/session'
import authorization from '@holo-js/authorization'
import {notFound} from 'next/navigation'
import {adminActions, normalizeRolePermissions, type AdminAction, type AdminCapabilities, type AdminResource, type RolePermissions} from '@/lib/admin/access'
import Role from '@/server/models/Role'
import Admin from '@/server/models/Admin'

export async function requireAdminPermission(resource: AdminResource, action: AdminAction) {
  const user = await getCurrentAdmin()
  if (!user) throw new Error('Your admin session has expired. Sign in again.')
  await authorization.forUser(user).ability('admin.access').authorize({resource, action})
  return user
}

export async function requireAdminPagePermission(resource: AdminResource, action: AdminAction) {
  try {
    return await requireAdminPermission(resource, action)
  } catch {
    notFound()
  }
}

export async function getAdminResourceCapabilities(resource: AdminResource): Promise<AdminCapabilities> {
  const user = await getCurrentAdmin()
  const actor = authorization.forUser(user)
  const entries = await Promise.all(adminActions.map(async (action) => [
    action,
    user ? await actor.ability('admin.access').can({resource, action}) : false,
  ] as const))
  return Object.fromEntries(entries) as AdminCapabilities
}

export async function getAdminNavigationAccess(admin: object): Promise<{owner: boolean; permissions: RolePermissions}> {
  const adminId = Number((admin as {id?: unknown}).id)
  const current = Number.isSafeInteger(adminId) && adminId > 0 ? await Admin.where('id', adminId).firstJson() : null
  if (!current) return {owner: false, permissions: {}}
  const roleValue = current?.role_id
  if (current.is_primary_admin) return {owner: true, permissions: {}}
  const roleId = Number(roleValue)
  if (!Number.isSafeInteger(roleId) || roleId < 1) return {owner: false, permissions: {}}
  const role = await Role.where('id', roleId).firstJson()
  return {owner: false, permissions: normalizeRolePermissions(role?.permissions)}
}
