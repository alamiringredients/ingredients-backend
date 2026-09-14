import assert from 'node:assert/strict'
import test from 'node:test'
import {cmsMediaDefinition} from '../server/support/cms-media'

test('category artwork conversion is capped at 300 pixels', () => {
  const artwork = cmsMediaDefinition({artwork: true}).conversions.find(item => item.definition.name === 'artwork')?.definition

  assert.ok(artwork)
  assert.equal(artwork.width, 300)
  assert.equal(artwork.height, 300)
  assert.equal(artwork.fit, 'inside')
  assert.equal(artwork.format, 'webp')
})

test('shared media models do not generate the category artwork conversion', () => {
  assert.equal(cmsMediaDefinition().conversions.some(item => item.definition.name === 'artwork'), false)
})
