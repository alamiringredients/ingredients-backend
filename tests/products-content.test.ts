import assert from 'node:assert/strict'
import {test} from 'node:test'
import {removeProductsCertificationFields} from '../lib/cms/products-content'
import type {ManagedPageContent} from '../lib/cms/contracts'
import seed from '../server/db/seed-data/site-content.json'

const products = seed.website_settings.find(row => row.setting_key === 'products')!.value as ManagedPageContent

test('fresh Products page content leaves certification identities and logos to their records', () => {
  assert.deepEqual(removeProductsCertificationFields(products), products)
  const section = products.sections.find(section => section.key === 'deep')!
  assert.equal(section.assets.length, 0)
  assert.ok(section.texts.some(field => field.source === 'Certification verification'))
  assert.equal(section.richTexts?.length, 2)
})

test('old Products page submissions cannot restore certification duplicates or overwrite editorial content', () => {
  const content = structuredClone(products)
  const section = content.sections.find(section => section.key === 'deep')!
  section.texts[0].values.en = 'Edited introduction'
  const editorial = structuredClone(section)
  section.texts.push({id: 'old-name', source: 'ISO 45001', label: 'ISO 45001', values: {en: 'Old name', ar: '', fr: ''}})
  section.assets.push({id: 'old-logo', kind: 'image', source: '/assets/certs/iso-45001.webp', label: 'Old logo', value: '/storage/old-logo.webp'})
  const cleaned = removeProductsCertificationFields(content)
  assert.deepEqual(cleaned.sections.find(section => section.key === 'deep'), editorial)
  assert.deepEqual(cleaned.sections.filter(section => section.key !== 'deep'), products.sections.filter(section => section.key !== 'deep'))
})
