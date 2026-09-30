import {DB, defineMigration} from '@holo-js/db'
import {managedSectionNames, nameManagedSections} from '@/lib/cms/section-names'
import type {ManagedPageKey} from '@/lib/cms/managed-pages'
import type {ManagedPageContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up() {
    const rows = await DB.table('website_settings').whereIn('setting_key', Object.keys(managedSectionNames)).get()
    for (const row of rows) {
      const content = (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) as ManagedPageContent
      const named = nameManagedSections(row.setting_key as ManagedPageKey, content)
      await DB.table('website_settings').where('id', Number(row.id)).update({value: JSON.stringify(named)})
    }
  },
  async down() {},
})
