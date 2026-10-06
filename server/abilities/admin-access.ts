import {allow, defineAbility, deny} from '@holo-js/authorization'
import {adminActions, adminResources, type AdminAction, type AdminResource} from '@/lib/admin/access'
import RolePermission from '@/server/models/RolePermission'
import Admin from '@/server/models/Admin'
import {adminSessionMatches} from '@/lib/admin/session'

type AdminActor = {id?: unknown; auth_version?: unknown}

export default defineAbility('admin.access', async (context, input: {resource: AdminResource; action: AdminAction}) => {
  if (!context.authenticated || !context.user) return deny('Your admin session has expired. Sign in again.')
  if (!adminResources.some(({key}) => key === input.resource) || !adminActions.includes(input.action)) {
    return deny('This permission does not exist.')
  }

  const actor = context.user as AdminActor
  const actorId = Number(actor.id)
  if (!Number.isSafeInteger(actorId) || actorId < 1) return deny('Your admin account is invalid.')
  const admin = await Admin.where('id', actorId).firstJson()
  if (!admin) return deny('Your admin account no longer exists.')
  if (!adminSessionMatches(actor, admin)) return deny('Your session has expired. Sign in again.')
  if (admin.is_primary_admin) return allow()

  const roleId = Number(admin.role_id)
  if (!Number.isSafeInteger(roleId) || roleId < 1) return deny('Your account does not have a valid role.')
  const permission = await RolePermission.where('role_id', roleId).where('resource', input.resource).where('action', input.action).firstJson()
  return permission
    ? allow()
    : deny(`Your role cannot ${input.action} ${input.resource.replaceAll('_', ' ')}.`)
})
