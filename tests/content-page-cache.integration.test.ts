import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createConnection} from 'mysql2/promise'
import {DB, configureDB, createConnectionManager, createDialect, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import cache, {configureCacheRuntime, resetCacheRuntime} from '@holo-js/cache'
import {catalogCacheKeys, newsCacheKeys, careersCacheKeys, sustainabilityCacheKeys, searchCacheKeys, contentCacheKeyForSetting} from '../server/support/cache-keys'
import WebsiteSetting from '../server/models/WebsiteSetting'
import NewsArticle from '../server/models/NewsArticle'
import NewsPublication from '../server/models/NewsPublication'
import NewsTaxonomy from '../server/models/NewsTaxonomy'
import SustainabilityArticle from '../server/models/SustainabilityArticle'
import SustainabilityPublication from '../server/models/SustainabilityPublication'
import SustainabilityGoal from '../server/models/SustainabilityGoal'
import SustainabilityGoalTranslation from '../server/models/SustainabilityGoalTranslation'
import CareerJob from '../server/models/CareerJob'
import ProductApplication from '../server/models/ProductApplication'
import ProductApplicationTranslation from '../server/models/ProductApplicationTranslation'
import ConcentrationRange from '../server/models/ConcentrationRange'
import ConcentrationRangeTranslation from '../server/models/ConcentrationRangeTranslation'

const writes: {table: string; column: string; keys: string[]; create: () => Promise<number>; update: (id: number) => Promise<unknown>; remove: (id: number) => Promise<unknown>}[] = [
  {table: 'news_articles', column: 'slug', keys: [...newsCacheKeys, ...careersCacheKeys, ...searchCacheKeys],
    create: async () => Number((await NewsArticle.create({slug: 'article'})).get('id')),
    update: async id => (await NewsArticle.findOrFail(id)).update({slug: 'updated-article'}),
    remove: async id => (await NewsArticle.findOrFail(id)).delete(),
  },
  {table: 'news_publications', column: 'revision', keys: [...newsCacheKeys, ...careersCacheKeys, ...searchCacheKeys],
    create: async () => Number((await NewsPublication.create({revision: 1})).get('id')),
    update: async id => (await NewsPublication.findOrFail(id)).update({revision: 2}),
    remove: async id => (await NewsPublication.findOrFail(id)).delete(),
  },
  {table: 'news_taxonomies', column: 'slug', keys: [...newsCacheKeys, ...searchCacheKeys],
    create: async () => Number((await NewsTaxonomy.create({slug: 'tag'})).get('id')),
    update: async id => (await NewsTaxonomy.findOrFail(id)).update({slug: 'updated-tag'}),
    remove: async id => (await NewsTaxonomy.findOrFail(id)).delete(),
  },
  {table: 'sustainability_articles', column: 'slug', keys: [...sustainabilityCacheKeys],
    create: async () => Number((await SustainabilityArticle.create({slug: 'article'})).get('id')),
    update: async id => (await SustainabilityArticle.findOrFail(id)).update({slug: 'updated-article'}),
    remove: async id => (await SustainabilityArticle.findOrFail(id)).delete(),
  },
  {table: 'sustainability_publications', column: 'revision', keys: [...sustainabilityCacheKeys],
    create: async () => Number((await SustainabilityPublication.create({revision: 1})).get('id')),
    update: async id => (await SustainabilityPublication.findOrFail(id)).update({revision: 2}),
    remove: async id => (await SustainabilityPublication.findOrFail(id)).delete(),
  },
  {table: 'sustainability_goals', column: 'color', keys: [...sustainabilityCacheKeys],
    create: async () => Number((await SustainabilityGoal.create({color: '#000000'})).get('id')),
    update: async id => (await SustainabilityGoal.findOrFail(id)).update({color: '#ffffff'}),
    remove: async id => (await SustainabilityGoal.findOrFail(id)).delete(),
  },
  {table: 'sustainability_goal_translations', column: 'name', keys: [...sustainabilityCacheKeys],
    create: async () => Number((await SustainabilityGoalTranslation.create({name: 'Goal'})).get('id')),
    update: async id => (await SustainabilityGoalTranslation.findOrFail(id)).update({name: 'Updated goal'}),
    remove: async id => (await SustainabilityGoalTranslation.findOrFail(id)).delete(),
  },
  {table: 'career_jobs', column: 'status', keys: [...careersCacheKeys, ...searchCacheKeys],
    create: async () => Number((await CareerJob.create({status: 'open'})).get('id')),
    update: async id => (await CareerJob.findOrFail(id)).update({status: 'closed'}),
    remove: async id => (await CareerJob.findOrFail(id)).delete(),
  },
  {table: 'product_applications', column: 'slug', keys: [...catalogCacheKeys, ...searchCacheKeys],
    create: async () => Number((await ProductApplication.create({slug: 'filter'})).get('id')),
    update: async id => (await ProductApplication.findOrFail(id)).update({slug: 'updated-filter'}),
    remove: async id => (await ProductApplication.findOrFail(id)).delete(),
  },
  {table: 'application_translations', column: 'name', keys: [...catalogCacheKeys, ...searchCacheKeys],
    create: async () => Number((await ProductApplicationTranslation.create({name: 'Filter'})).get('id')),
    update: async id => (await ProductApplicationTranslation.findOrFail(id)).update({name: 'Updated filter'}),
    remove: async id => (await ProductApplicationTranslation.findOrFail(id)).delete(),
  },
  {table: 'concentration_ranges', column: 'slug', keys: [...catalogCacheKeys, ...searchCacheKeys],
    create: async () => Number((await ConcentrationRange.create({slug: 'filter'})).get('id')),
    update: async id => (await ConcentrationRange.findOrFail(id)).update({slug: 'updated-filter'}),
    remove: async id => (await ConcentrationRange.findOrFail(id)).delete(),
  },
  {table: 'concentration_translations', column: 'name', keys: [...catalogCacheKeys, ...searchCacheKeys],
    create: async () => Number((await ConcentrationRangeTranslation.create({name: 'Filter'})).get('id')),
    update: async id => (await ConcentrationRangeTranslation.findOrFail(id)).update({name: 'Updated filter'}),
    remove: async id => (await ConcentrationRangeTranslation.findOrFail(id)).delete(),
  },
]

test('public content observers invalidate persisted caches only after committed model writes', async () => {
  loadEnvFile('.env')
  const directory = await mkdtemp(join(tmpdir(), 'content-cache-'))
  const config = {default: 'file', drivers: {file: {driver: 'file' as const, path: directory}}}
  configureCacheRuntime({config})
  const client = await createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
  const originalNow = Date.now
  try {
    const [mediaSchema] = await client.query('SHOW CREATE TABLE media')
    const mediaDdl = (mediaSchema as {'Create Table': string}[])[0]['Create Table']
    await client.query(mediaDdl.replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'))
    for (const write of writes) {
      await client.query(`CREATE TEMPORARY TABLE ${write.table} (id INT PRIMARY KEY AUTO_INCREMENT, ${write.column} VARCHAR(200), created_at DATETIME, updated_at DATETIME)`)
      const prime = async () => {for (const key of write.keys) await cache.forever(key, 'Cached')}
      const expect = async (value: string | null) => {for (const key of write.keys) assert.equal(await cache.get(key), value, `${write.table}: ${key}`)}
      await prime()
      resetCacheRuntime(); configureCacheRuntime({config})
      const id = await DB.transaction(async () => {const id = await write.create(); await expect('Cached'); return id})
      await expect(null)
      await prime()
      await assert.rejects(DB.transaction(async () => {await write.update(id); throw Error('Rollback fixture')}), /Rollback fixture/)
      await expect('Cached')
      await DB.transaction(async () => {await write.update(id); await expect('Cached')})
      await expect(null)
      await prime()
      await assert.rejects(DB.transaction(async () => {await write.remove(id); throw Error('Rollback fixture')}), /Rollback fixture/)
      await expect('Cached')
      await DB.transaction(async () => {await write.remove(id); await expect('Cached')})
      await expect(null)
    }
    await client.query('CREATE TEMPORARY TABLE website_settings (id INT PRIMARY KEY AUTO_INCREMENT, setting_key VARCHAR(100), value JSON, created_at DATETIME, updated_at DATETIME)')
    await DB.table('website_settings').insert({id: 1, setting_key: 'about', value: JSON.stringify({title: {en: 'Original', fr: 'Original FR'}})})
    const read = () => cache.rememberForever(contentCacheKeyForSetting('about'), async () => (await WebsiteSetting.where('setting_key', 'about').firstJson())?.value as {title: {en: string; fr?: string}})
    assert.deepEqual(await read(), {title: {en: 'Original', fr: 'Original FR'}})
    Date.now = () => originalNow() + 365 * 24 * 60 * 60 * 1000
    resetCacheRuntime(); configureCacheRuntime({config})
    assert.deepEqual(await read(), {title: {en: 'Original', fr: 'Original FR'}})
    await DB.transaction(async () => {
      await (await WebsiteSetting.findOrFail(1)).update({value: {title: {en: 'Updated'}}})
      assert.notEqual(await cache.get(contentCacheKeyForSetting('about')), null)
    })
    assert.equal(await cache.get(contentCacheKeyForSetting('about')), null)
    assert.deepEqual(await read(), {title: {en: 'Updated'}})
  } finally {
    Date.now = originalNow
    resetCacheRuntime(); resetDB(); await client.end()
    await rm(directory, {recursive: true, force: true})
  }
})
