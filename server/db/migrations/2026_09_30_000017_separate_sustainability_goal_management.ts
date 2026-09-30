import {DB, defineMigration} from '@holo-js/db'

export default defineMigration({
  async up() {
    const row = await DB.table('website_settings').where('setting_key', 'sustainability').first()
    if (row) {
      const content = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      if ('goals' in content) {
        delete content.goals
        await DB.table('website_settings').where('id', Number(row.id)).update({value:JSON.stringify(content)})
      }
    }
    const role = await DB.table('roles').where('name', 'Super admin').first()
    if (role) {
      const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions
      if (!('sustainability_goals' in permissions)) {
        permissions.sustainability_goals = ['view', 'create', 'edit', 'delete']
        await DB.table('roles').where('id', Number(role.id)).update({permissions:JSON.stringify(permissions)})
      }
    }
  },
  async down() {},
})
