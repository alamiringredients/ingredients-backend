import assert from 'node:assert/strict'
import {test} from 'node:test'
import {getSchema} from '@tiptap/core'
import {inlineExtensions} from '../components/editor/extensions'

test('compact fields retain saved headings, emphasis and heading identity', () => {
  const schema = getSchema(inlineExtensions)
  const document = schema.nodeFromJSON({type: 'doc', content: [{
    type: 'heading', attrs: {level: 2, id: 'hero-heading', visible: true, hideFromContents: false},
    content: [{type: 'text', text: 'Specification-led, '}, {type: 'text', text: 'audit-ready.', marks: [{type: 'italic'}]}],
  }]})
  document.check()
  assert.equal(document.textContent, 'Specification-led, audit-ready.')
  const heading = document.toJSON().content[0]
  assert.equal(heading.attrs.id, 'hero-heading')
  assert.equal(heading.attrs.level, 2)
  assert.deepEqual(heading.content[1].marks, [{type: 'italic'}])
})
