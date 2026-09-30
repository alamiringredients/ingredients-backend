import assert from 'node:assert/strict'
import {test} from 'node:test'
import seed from '../server/db/seed-data/site-content.json'
import snapshot from '../server/db/seed-data/managed-content-snapshot.json'
import countryNames from '../lib/cms/country-names.json'
import {removeHomeCountryFields} from '../lib/cms/country-content'
import type {HomeSectionContent} from '../lib/cms/contracts'

test('fresh installs manage country names in Translations instead of homepage content', () => {
  for (const name of countryNames) {
    const translation = seed.content_translations.find(row => row.source === name)!
    assert.equal(translation.page, 'countries')
    for (const locale of ['en', 'ar', 'fr']) {
      assert.ok(seed.content_translation_values.find(row => row.translation_id === translation.id && row.locale === locale)?.value)
    }
  }
  for (const section of [seed.home_sections.find(row => row.section_key === 'contact')!.content, snapshot.home.sections.find(row => row.key === 'contact')!]) {
    assert.equal(section.texts.some(field => countryNames.includes(field.source)), false)
    assert.ok(section.texts.some(field => field.source === 'Country'))
    assert.ok(section.texts.some(field => field.source === 'Export desk'))
  }
})

test('saving an old homepage form cannot restore country duplicates or lose its own content', () => {
  const section = structuredClone(snapshot.home.sections.find(row => row.key === 'contact')!) as HomeSectionContent
  const ownFields = structuredClone(section.texts)
  section.texts.push({id: 'old-country', source: 'Egypt', label: 'Egypt', values: {en: 'Egypt', ar: 'مصر', fr: 'Égypte'}})
  assert.deepEqual(removeHomeCountryFields(section).texts, ownFields)
  assert.equal(section.texts.length, ownFields.length + 1)
})
