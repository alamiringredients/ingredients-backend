import {DB, defineMigration} from '@holo-js/db'
import {removeProductsCertificationFields} from '@/lib/cms/products-content'
import type {ManagedPageContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up() {
    const row = await DB.table('website_settings').where('setting_key', 'products').first()
    if (!row) return
    const content = (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) as ManagedPageContent
    await DB.table('website_settings').where('id', Number(row.id)).update({value: JSON.stringify(removeProductsCertificationFields(content))})
  },
  async down() {},
})
