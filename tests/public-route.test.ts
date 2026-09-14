import assert from 'node:assert/strict'
import {test} from 'node:test'
import {payload as catalogPayload} from '../server/http/controllers/public/catalog-controller'

test('public routes validate locale before reading content', async () => {
  for (const query of ['', '?locale=de']) {
    const response = await catalogPayload(new Request(`http://localhost/api/v1/public/catalog/payload${query}`))
    assert.equal(response.status, 422)
    assert.equal(response.headers.get('Cache-Control'), null)
    assert.equal(typeof (await response.json()).message, 'string')
  }
})
