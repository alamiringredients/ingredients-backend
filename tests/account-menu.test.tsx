import assert from 'node:assert/strict'
import test from 'node:test'
import {renderToStaticMarkup} from 'react-dom/server'
import {loadConfigDirectory} from '@holo-js/config'
import {AccountMenu} from '@/components/admin/account-menu'

test('CORS origins read FRONTEND_URL', async () => {
  const frontendUrl = 'https://alamir.example'
  const loaded = await loadConfigDirectory(process.cwd(), {
    envName: 'test',
    processEnv: {...process.env, FRONTEND_URL: frontendUrl},
    preferCache: false,
  })

  assert.equal(loaded.cors.origins[0], frontendUrl)
})

test('view website opens the configured frontend URL in a new tab', () => {
  const frontendUrl = 'https://alamir.example'
  const html = renderToStaticMarkup(<AccountMenu adminName="Administrator" canViewSettings={false} frontendUrl={frontendUrl}/>)

  assert.match(html, new RegExp(`href="${frontendUrl}"`))
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.doesNotMatch(html, /\/undefined/)
})
