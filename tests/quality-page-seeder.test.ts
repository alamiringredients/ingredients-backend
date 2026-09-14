import assert from 'node:assert/strict'
import {test} from 'node:test'
import {getQualityPageSeedContent} from '../server/db/seeders/QualityPageSeeder'
import {textContent} from '../lib/editor/document'
import {validateAbout} from '../lib/careers/validation'

test('quality page seed content includes Arabic and French for every owned text field', () => {
  const content = getQualityPageSeedContent()
  assert.notEqual(textContent(content.body.ar), textContent(content.body.en))
  assert.notEqual(textContent(content.body.fr), textContent(content.body.en))
  for (const value of [content.seo.title, content.seo.description, content.seo.socialTitle, content.seo.socialDescription]) {
    assert.notEqual(value.ar, value.en)
    assert.notEqual(value.fr, value.en)
  }
})

test('quality page is one editable document per locale', () => {
  const content=getQualityPageSeedContent()
  assert.doesNotThrow(()=>validateAbout(structuredClone(content)))
  assert.deepEqual(content.body.en.content.map(node=>node.attrs?.id),['credentials','roadmap','technology','sourcing'])
  assert.ok(content.body.en.content.every(node=>node.type==='contentSection'))
})
