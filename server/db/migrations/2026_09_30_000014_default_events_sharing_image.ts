import {DB, defineMigration} from '@holo-js/db'
import type {ManagedPageContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up() {
    const row = await DB.table('website_settings').where('setting_key', 'events').first()
    if (!row) return
    const content = (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) as ManagedPageContent
    if (content.seo.socialImage) return
    const hero = content.sections.find(section => section.key === 'hero')
    const image = hero?.assets.find(asset => asset.kind === 'image' && asset.value)?.value
    if (!image) return
    content.seo.socialImage = image
    await DB.table('website_settings').where('id', Number(row.id)).update({value: JSON.stringify(content)})
  },
  async down() {},
})
