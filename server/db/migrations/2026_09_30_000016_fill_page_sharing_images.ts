import {DB, defineMigration} from '@holo-js/db'
import type {HomeSectionContent, HomeSeoContent} from '@/lib/cms/contracts'

type PageContent = {
  seo?: HomeSeoContent
  heroImage?: string
  hero?: {image?: string}
  sections?: HomeSectionContent[]
}

export default defineMigration({
  async up() {
    const rows = await DB.table('website_settings').get()
    const website = rows.find(row => row.setting_key === 'website')
    const settings = typeof website?.value === 'string' ? JSON.parse(website.value) : website?.value
    if (!settings?.socialImage) throw new Error('Set the website sharing image before filling page sharing images.')
    for (const row of rows) {
      const content = (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) as PageContent
      if (!content.seo || !('socialImage' in content.seo) || content.seo.socialImage?.trim()) continue
      const hero = content.sections?.find(section => section.key === 'hero' || section.key === 'section-0')
      content.seo.socialImage = content.heroImage || content.hero?.image || hero?.assets.find(asset => asset.kind === 'image' && asset.value)?.value || settings.socialImage
      await DB.table('website_settings').where('id', Number(row.id)).update({value: JSON.stringify(content)})
    }
  },
  async down() {},
})
