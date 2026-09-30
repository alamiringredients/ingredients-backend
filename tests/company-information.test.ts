import assert from 'node:assert/strict'
import {test} from 'node:test'
import {removeCompanyInformation} from '../lib/cms/company-information'
import seed from '../server/db/seed-data/site-content.json'
import snapshot from '../server/db/seed-data/managed-content-snapshot.json'
import {companyInformationDefaults} from '../server/db/seed-data/company-information'
import {validate, isValidationException} from '@holo-js/forms'
import {companyInformation} from '../app/admin/cms-schema'

test('fresh installs own shared company details in Website settings', () => {
  const settings = seed.website_settings.find(row => row.setting_key === 'website')!.value
  assert.deepEqual(settings.company, companyInformationDefaults)
  assert.deepEqual(removeCompanyInformation(seed), seed)
  assert.deepEqual(removeCompanyInformation(snapshot), snapshot)
  assert.notEqual(settings.company.phone, settings.company.exportPhone)
  for (const locale of ['en', 'ar', 'fr'] as const) assert.ok(settings.company.address[locale])
})

test('old page forms cannot restore shared company fields while editorial content is retained', () => {
  const content = {
    texts: [{source: 'Phone'}, {source: '+20 100 550 5020'}],
    links: [{source: 'https://www.facebook.com/', value: 'https://www.facebook.com/company'}, {source: 'https://supplier.example', value: 'https://supplier.example'}],
    richTexts: [{sources: ['Menoufia, Egypt']}, {sources: ['Our story']}, {sources: []}],
    body: {type: 'text', text: 'Contact our team', marks: [{type: 'link', attrs: {href: 'mailto:sales@alamiringredients.com'}}]},
  }
  assert.deepEqual(removeCompanyInformation(content), {
    texts: [{source: 'Phone'}],
    links: [content.links[1]],
    richTexts: [content.richTexts[1], content.richTexts[2]],
    body: content.body,
  })
  assert.equal(content.texts.length, 2)
})

test('company settings accept shared contact details and reject internal website destinations', async () => {
  assert.deepEqual((await validate({company: companyInformationDefaults}, companyInformation)).company, companyInformationDefaults)
  await assert.rejects(validate({company: {...companyInformationDefaults, website: '/contact'}}, companyInformation), isValidationException)
})
