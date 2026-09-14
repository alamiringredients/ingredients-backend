import {defineSeeder} from '@holo-js/db'
import source from '../seed-data/site-content.json'
import {getEventFormErrorDefinitions} from '../seed-data/event-interface-definitions'
import {getEnquiryInterfaceDefinitions} from '../seed-data/enquiry-interface-definitions'
import {getCareersInterfaceDefinitions} from '../seed-data/careers-interface'
import ContentTranslation from '@/server/models/ContentTranslation'
import ContentTranslationValue from '@/server/models/ContentTranslationValue'
import TranslationSeedKey from '@/server/models/TranslationSeedKey'

export default defineSeeder({
  name: 'content_translations',
  async run() {
    const valuesByTranslation = new Map<number, typeof source.content_translation_values>()
    for (const value of source.content_translation_values) {
      const values = valuesByTranslation.get(value.translation_id) ?? []
      values.push(value)
      valuesByTranslation.set(value.translation_id, values)
    }

    for (const row of source.content_translations) {
      if (await TranslationSeedKey.where('translation_key', row.translation_key).first()) continue
      if (!await ContentTranslation.where('translation_key', row.translation_key).first()) {
        const translation = await ContentTranslation.create({translation_key: row.translation_key, page: row.page, source: row.source})
        for (const value of valuesByTranslation.get(row.id) ?? []) {
          await ContentTranslationValue.create({translation_id: Number(translation.id), locale: value.locale, value: value.value})
        }
      }
      await TranslationSeedKey.create({translation_key: row.translation_key})
    }

    for (const entry of [...getEventFormErrorDefinitions(), ...getEnquiryInterfaceDefinitions(), ...getCareersInterfaceDefinitions()]) {
      if (await TranslationSeedKey.where('translation_key', entry.key).first()) continue
      if (!await ContentTranslation.where('translation_key', entry.key).first()) {
        const translation = await ContentTranslation.create({translation_key: entry.key, page: entry.page, source: entry.source})
        for (const [locale, value] of Object.entries(entry.translations)) {
          await ContentTranslationValue.create({translation_id: Number(translation.id), locale, value})
        }
      }
      await TranslationSeedKey.create({translation_key: entry.key})
    }
  },
})
