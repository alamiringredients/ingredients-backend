import {defineSeeder} from '@holo-js/db'
import Role from '@/server/models/Role'
import {fullRolePermissions, type RolePermissions} from '@/lib/admin/access'

export default defineSeeder({
  name: 'roles',
  async run() {
    const role = await Role.firstOrCreate({name: 'Super admin'}, {description: 'Full access to every admin model and action.', permissions: fullRolePermissions()})
    const raw = role.permissions
    const permissions = (typeof raw === 'string' ? JSON.parse(raw) : raw) as RolePermissions
    // Add newly introduced resources without resetting previously edited permissions.
    const missing = Object.entries(fullRolePermissions()).filter(([key]) => !(key in permissions))
    if (missing.length) await (await Role.findOrFail(Number(role.id))).update({permissions: {...permissions, ...Object.fromEntries(missing)}})
  },
})
