import {DB, defineMigration} from '@holo-js/db'
import {normalizeRolePermissions, permissionsFromRows, rolePermissionRows} from '@/lib/admin/access'

export default defineMigration({
  async up({schema}) {
    if (!await schema.hasTable('role_permissions')) {
      await schema.createTable('role_permissions', table => {
        table.id()
        table.bigInteger('role_id')
        table.string('resource')
        table.enum('action', ['view', 'create', 'edit', 'delete'])
        table.unique(['role_id', 'resource', 'action'])
        table.foreign('role_id').references('id').on('roles').onDelete('cascade')
      })
    }
    if (!(await schema.getColumns('roles')).some(column => column.name === 'permissions')) return
    const roles = await DB.table('roles as legacy').select('id', 'permissions').get()
    const rows = roles.flatMap(role => rolePermissionRows(Number(role.id), normalizeRolePermissions(typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions)))
    if (rows.length) await DB.table('role_permissions').upsert(rows, ['role_id', 'resource', 'action'], ['action'])
    await schema.table('roles', table => table.dropColumn('permissions'))
  },
  async down({schema}) {
    await schema.table('roles', table => {table.json('permissions').nullable()})
    const [roles, permissions] = await Promise.all([DB.table('roles').get(), DB.table('role_permissions').get()])
    const byRole = new Map<number, {resource: string; action: string}[]>()
    for (const permission of permissions) {
      const id = Number(permission.role_id)
      const grants = byRole.get(id) ?? []
      grants.push({resource: String(permission.resource), action: String(permission.action)})
      byRole.set(id, grants)
    }
    const rows = roles.map(role => ({...role, permissions: JSON.stringify(permissionsFromRows(byRole.get(Number(role.id)) ?? []))}))
    if (rows.length) await DB.table('roles as legacy').upsert(rows, ['id'], ['permissions'])
    await schema.table('roles', table => {table.json('permissions').notNull().change()})
    await schema.dropTable('role_permissions')
  },
})
