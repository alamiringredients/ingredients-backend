import {DB, defineMigration} from '@holo-js/db'
import countryNames from '@/lib/cms/country-names.json'
import {homeArabic, homeFrench} from '../seed-data/home-translations'
import {removeHomeCountryFields} from '@/lib/cms/country-content'
import type {HomeSectionContent} from '@/lib/cms/contracts'

export default defineMigration({
  async up() {
    const row = await DB.table('home_sections').where('section_key', 'contact').first()
    const content: HomeSectionContent | undefined = row ? (typeof row.content === 'string' ? JSON.parse(row.content) : row.content) : undefined
    for (const source of countryNames) {
      const defaults = {en: source, ar: homeArabic[source], fr: homeFrench[source]}
      const translation = await DB.table('content_translations').where('source', source).first()
      if (!translation) {
        if (content?.texts.some(field => field.source === source)) throw new Error(`Country translation is missing: ${source}`)
        continue
      }
      await DB.table('content_translations').where('id', Number(translation.id)).update({page: 'countries'})
      const saved = content?.texts.find(field => field.source === source)
      for (const locale of ['en', 'ar', 'fr'] as const) {
        if (saved && saved.values[locale] !== defaults[locale]) {
          await DB.table('content_translation_values').where('translation_id', Number(translation.id)).where('locale', locale).update({value: saved.values[locale]})
        }
      }
    }
    if (row && content) await DB.table('home_sections').where('id', Number(row.id)).update({content: JSON.stringify(removeHomeCountryFields(content))})
  },
  async down() {},
})
