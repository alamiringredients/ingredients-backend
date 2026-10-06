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
  },
  async down() {},
})
