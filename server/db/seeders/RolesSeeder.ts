import {DB, defineSeeder} from '@holo-js/db'
import Role from '@/server/models/Role'
import {fullRolePermissions, rolePermissionRows} from '@/lib/admin/access'

export default defineSeeder({
  name: 'roles',
  async run() {
    await DB.transaction(async () => {
      const role = await Role.firstOrCreate({name: 'Super admin'}, {description: 'Full access to every admin model and action.'})
      await DB.table('role_permissions').upsert(rolePermissionRows(Number(role.id), fullRolePermissions()), ['role_id', 'resource', 'action'], ['action'])
    })
  },
})
