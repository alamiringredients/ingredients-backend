import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {DB, configureDB, createConnectionManager, createDialect, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureCacheRuntime,resetCacheRuntime} from '@holo-js/cache'
import seeder from '../server/db/seeders/ContentTranslationSeeder'
import source from '../server/db/seed-data/site-content.json'
import {getEventFormErrorDefinitions} from '../server/db/seed-data/event-interface-definitions'
import {getEnquiryInterfaceDefinitions} from '../server/db/seed-data/enquiry-interface-definitions'
import {getCareersInterfaceDefinitions} from '../server/db/seed-data/careers-interface'

test('translation seed history preserves edits and intentional deletions', async () => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
  configureCacheRuntime({config:{default:'memory',drivers:{memory:{driver:'memory'}}}})
  try {
    // Connection-local tables keep this test independent of the site's translations.
    await client.query('CREATE TEMPORARY TABLE content_translations (id BIGINT AUTO_INCREMENT PRIMARY KEY, translation_key VARCHAR(255) UNIQUE, page VARCHAR(255), source TEXT, created_at DATETIME NULL, updated_at DATETIME NULL)')
    await client.query('CREATE TEMPORARY TABLE content_translation_values (id BIGINT AUTO_INCREMENT PRIMARY KEY, translation_id BIGINT, locale VARCHAR(255), value TEXT, created_at DATETIME NULL, updated_at DATETIME NULL, UNIQUE(translation_id, locale))')
    await client.query('CREATE TEMPORARY TABLE translation_seed_keys (id BIGINT AUTO_INCREMENT PRIMARY KEY, translation_key VARCHAR(255) UNIQUE, created_at DATETIME NULL, updated_at DATETIME NULL)')
    await seeder.run()
    const [deleted, edited] = source.content_translations
    const deletedId = Number((await DB.table('content_translations').where('translation_key', deleted.translation_key).first())!.id)
    const editedId = Number((await DB.table('content_translations').where('translation_key', edited.translation_key).first())!.id)
    await DB.table('content_translation_values').where('translation_id', deletedId).delete()
    await DB.table('content_translations').where('id', deletedId).delete()
    await DB.table('content_translation_values').where('translation_id', editedId).where('locale', 'en').update({value: 'An editor changed this'})
    await seeder.run()
    assert.equal(await DB.table('content_translations').where('id', deletedId).first(), undefined)
    assert.equal(await DB.table('content_translation_values').where('translation_id', deletedId).first(), undefined)
    assert.equal((await DB.table('content_translation_values').where('translation_id', editedId).where('locale', 'en').first())?.value, 'An editor changed this')
    const expectedKeys = new Set(source.content_translations.map(row => row.translation_key))
    for (const entry of [...getEventFormErrorDefinitions(), ...getEnquiryInterfaceDefinitions(), ...getCareersInterfaceDefinitions()]) expectedKeys.add(entry.key)
    assert.equal(Number(await DB.table('translation_seed_keys').count()), expectedKeys.size)
  } finally {
    resetCacheRuntime()
    resetDB()
    await client.end()
  }
})
