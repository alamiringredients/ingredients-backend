import {test} from 'node:test'
import assert from 'node:assert/strict'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {configureDB, createConnectionManager, createDialect, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {getCrudIndex} from '../server/admin/crud-index'
import {textContent, type ContentDocument} from '../lib/editor/document'
import {decodeStoredJson} from '../lib/cms/stored-json'

test('paginated article summaries preserve translated titles, images, and published languages', async () => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  try {
    configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
    for (const kind of ['news', 'sustainability'] as const) {
      const data = await getCrudIndex(kind, {})
      for (const row of data.rows) {
        const [versions] = await client.query(`SELECT locale, content FROM ${kind}_article_translations WHERE article_id = ?`, [row.id])
        const content = Object.fromEntries((versions as {locale: string; content: unknown}[]).map(version => [version.locale, decodeStoredJson<{title: ContentDocument; hero?: string; gallery?: {src: string}[]}>(version.content)]))
        assert.equal(row.name, textContent(content.en.title))
        assert.equal(row.subtitle, textContent(content.fr.title))
        assert.equal(row.image, kind === 'news' ? content.en.hero : content.en.gallery?.[0]?.src ?? '')
        const [published] = await client.query(`SELECT locale FROM ${kind}_publications WHERE article_id = ?`, [row.id])
        const locales = (published as {locale: string}[]).map(item => item.locale)
        const cell = row.cells[2]
        assert.ok(typeof cell === 'object' && 'active' in cell)
        assert.equal(cell.active, locales.length > 0)
        assert.equal(cell.detail, ['en', 'ar', 'fr'].filter(locale => locales.includes(locale)).join(' · ').toUpperCase())
        assert.ok(!('content' in row))
      }
    }
  } finally {resetDB(); await client.end()}
})
