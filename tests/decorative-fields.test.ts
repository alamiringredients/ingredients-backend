import assert from 'node:assert/strict'
import {test} from 'node:test'
import {removeDecorativeFields} from '../lib/cms/decorative-fields'
import seed from '../server/db/seed-data/site-content.json'
import snapshot from '../server/db/seed-data/managed-content-snapshot.json'

test('decorative controls are frontend-owned while real copy and data retain their values', () => {
  const content = {sections: [{texts: [
    {id: 'arrow', source: '-&gt;', values: {en: '-&gt;'}},
    {id: 'close', source: '×', values: {en: '×'}},
    {id: 'separator', source: '/', values: {en: '/'}},
    {id: 'copy', source: 'Send enquiry →', values: {en: 'Contact sales'}},
    {id: 'figure', source: '1970', values: {en: '1970'}},
  ], figures: [{unit: '+', value: 60}], body: {type: 'text', text: '→'}}]}
  const cleaned = removeDecorativeFields(content)
  assert.deepEqual(cleaned.sections[0].texts, content.sections[0].texts.slice(3))
  assert.deepEqual(cleaned.sections[0].figures, content.sections[0].figures)
  assert.deepEqual(cleaned.sections[0].body, content.sections[0].body)
  assert.equal(content.sections[0].texts.length, 5)
})

test('fresh seed data cannot reintroduce decorative text inputs', () => {
  for (const content of [seed, snapshot]) assert.deepEqual(removeDecorativeFields(content), content)
})
