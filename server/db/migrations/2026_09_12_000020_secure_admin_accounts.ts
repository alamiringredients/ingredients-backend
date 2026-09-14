import {DB, defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}) {
    const columns = await schema.getColumns('admins')
    await schema.table('admins', table => {
      if (!columns.some(column => column.name === 'is_primary_admin')) table.boolean('is_primary_admin').default(false)
      if (!columns.some(column => column.name === 'auth_version')) table.string('auth_version').default('')
    })
    // Capture the original account once; later role/name edits cannot transfer ownership.
    const role = await DB.table('roles').where('name', 'Super admin').first()
    const primary = role
      ? await DB.table('admins').where('role_id', Number(role.id)).orderBy('id').first()
      : await DB.table('admins').whereNull('role_id').orderBy('id').first()
    if (primary) await DB.table('admins').where('id', Number(primary.id)).update({is_primary_admin: true})
  },
  async down({schema}) {
    await schema.table('admins', table => {
      table.dropColumn('auth_version')
      table.dropColumn('is_primary_admin')
    })
  },
})
