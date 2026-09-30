import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {configureDB, createConnectionManager, createDialect, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {getTranslationList} from '../server/admin/translation-list'
import {getEventSlotList} from '../server/services/events/content'
import {getCrudIndex, type CrudKind} from '../server/admin/crud-index'

const kinds: CrudKind[] = ['products', 'product-categories', 'applications', 'concentrations', 'certifications', 'certification-types', 'news', 'sustainability', 'sustainability-goals', 'news-categories', 'news-tags', 'events', 'careers', 'admins', 'roles']
test('every CRUD index paginates and filters in Holo queries', async t => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
  try {
    for (const kind of kinds) await t.test(kind, async () => {
      const initial = await getCrudIndex(kind, {})
      assert.ok(initial.rows.length <= 25)
      assert.equal(initial.pagination.meta.perPage, 25)
      assert.equal(initial.stats[0].value, initial.pagination.meta.total)
      const empty = await getCrudIndex(kind, {q: '__no_such_record_86c541__'})
      assert.equal(empty.rows.length, 0)
      assert.equal(empty.pagination.meta.total, 0)
      if (initial.rows.length) {
        const match = await getCrudIndex(kind, {q: initial.rows[0].name})
        assert.ok(match.rows.some(row => row.id === initial.rows[0].id), `${kind}: name search misses first row`)
      }
      for (const filter of initial.filters) for (const option of filter.options) {
        const result = await getCrudIndex(kind, {[filter.key]: option.value})
        assert.equal(result.pagination.filters[filter.key], option.value)
        assert.ok(result.pagination.meta.total <= initial.pagination.meta.total)
      }
      const invalid = await getCrudIndex(kind, {page: '999999', status: 'invalid'})
      assert.equal(invalid.pagination.meta.currentPage, Math.max(1, invalid.pagination.meta.lastPage))
    })
    await t.test('translations page and search are applied before LIMIT', async () => {
      assert.equal((await getTranslationList({q:'__missing_86c541__'})).entries.length, 0)
      const first = await getTranslationList({})
      assert.equal(first.entries.length, 25)
      const second = await getTranslationList({page: '2'})
      assert.ok(second.entries.every(row => !first.entries.some(previous => previous.key === row.key)))
      const searched = await getTranslationList({q: first.entries[0].key})
      assert.ok(searched.entries.some(row => row.key === first.entries[0].key))
      const filtered = await getTranslationList({section: first.entries[0].page})
      assert.ok(filtered.entries.every(row => row.page === first.entries[0].page))
      assert.ok(first.entries.every(row => ['en', 'ar', 'fr'].every(locale => typeof row.translations[locale as 'en'] === 'string')))
    })
    await t.test('appointment rows stay scoped to their event', async () => {
      const [events] = await client.query('SELECT DISTINCT event_id FROM event_slots LIMIT 1')
      const eventId = Number((events as {event_id: number}[])[0]?.event_id ?? 0)
      const list = await getEventSlotList(eventId, {})
      assert.ok(list.slots.length <= 25)
      assert.ok(list.slots.every(slot => slot.eventId === eventId))
      const reserved = await getEventSlotList(eventId, {status: 'reserved'})
      assert.ok(reserved.slots.every(slot => slot.status === 'reserved'))
    })
    await t.test('multiple pages use SQL limits, combined filters, and literal search escaping', async () => {
      // Connection-local tables shadow real tables; all fixture rows vanish when this connection closes.
      await client.query('CREATE TEMPORARY TABLE career_jobs (id BIGINT PRIMARY KEY, slug VARCHAR(100), code VARCHAR(100), status VARCHAR(20), content JSON)')
      for (let id = 1; id <= 36; id++) {
        const title = id === 36 ? 'Literal %_ marker' : `Fixture ${id}`
        const content = {en: {title, department: 'Quality', location: 'Cairo', hero: ''}, ar: {title}, fr: {title}}
        await client.query('INSERT INTO career_jobs (id, slug, code, status, content) VALUES (?, ?, ?, ?, ?)', [id, `fixture-${id}`, `fixture-${id}`, id % 2 === 0 ? 'open' : 'draft', JSON.stringify(content)])
      }
      const statements: string[] = []
      const original = client.query.bind(client)
      client.query = ((...args: Parameters<typeof client.query>) => {statements.push(String(args[0])); return original(...args)}) as typeof client.query
      const first = await getCrudIndex('careers', {})
      const second = await getCrudIndex('careers', {page: '2'})
      const smaller = await getCrudIndex('careers', {perPage: '10', page: '2'})
      assert.equal(smaller.rows.length, 10)
      assert.equal(smaller.pagination.meta.from, 11)
      assert.equal(smaller.pagination.meta.lastPage, 4)
      assert.equal((await getCrudIndex('careers', {perPage: '1000000'})).pagination.meta.perPage, 25)
      assert.equal(first.pagination.meta.total, 36)
      assert.equal(first.rows.length, 25)
      assert.equal(second.rows.length, 11)
      assert.ok(second.rows.every(row => !first.rows.some(previous => previous.id === row.id)))
      const filtered = await getCrudIndex('careers', {q: 'Fixture', status: 'open', page: '100'})
      assert.equal(filtered.pagination.meta.total, 18)
      assert.ok(filtered.rows.every(row => row.id % 2 === 0))
      assert.equal(filtered.stats[0].value, 36)
      const escaped = await getCrudIndex('careers', {q: '%_'})
      assert.deepEqual(escaped.rows.map(row => row.id), [36])
      assert.ok(statements.filter(sql => /^SELECT/i.test(sql) && !/COUNT\(/i.test(sql)).every(sql => /LIMIT/i.test(sql)))
      assert.ok(statements.some(sql => /OFFSET/i.test(sql)))
      assert.ok(statements.some(sql => /COUNT/i.test(sql)))
    })
  } finally {resetDB(); await client.end()}
})
