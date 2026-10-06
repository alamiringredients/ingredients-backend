import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {createConnection} from 'mysql2/promise'
import {configureDB, createConnectionManager, createDialect, DB, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureCacheRuntime, resetCacheRuntime} from '@holo-js/cache'
import {configureStorageRuntime, resetStorageRuntime} from '@holo-js/storage/runtime'
import createS3Driver from '@holo-js/storage-s3'
import {Media, MediaItem} from '@holo-js/media'
import source from '../server/db/seed-data/site-content.json'
import MediaSeeder from '../server/db/seeders/MediaSeeder'
import type {WebsiteSettings} from '../lib/cms/contracts'
import {getWebsiteSettings, persistWebsiteSettings} from '../server/services/cms/content'
import {resolveMediaReferences, storeMediaPaths} from '../server/support/media-references'

// URL helpers use the real S3 driver without reading or writing objects.
function storage(url: string) {
  const options = {accessKeyId: 'test', secretAccessKey: 'test', endpoint: 'https://example.com', region: 'auto', bucket: 'test'}
  const backend = createS3Driver(options)
  configureStorageRuntime({
    getRuntimeConfig: () => ({holoStorage: {defaultDisk: 's3', diskNames: ['s3'], routePrefix: '/storage', disks: {s3: {...options, name: 's3', driver: 's3', visibility: 'public', url}}}}),
    getStorage: () => backend,
  })
}

test('CMS persists Holo paths and returns current configured URLs even from cached content', async () => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  try {
    for (const table of ['media', 'website_settings']) {
      const [rows] = await client.query(`SHOW CREATE TABLE \`${table}\``)
      const ddl = (rows as Array<{'Create Table': string}>)[0]['Create Table'].replace('CREATE TABLE', 'CREATE TEMPORARY TABLE')
      await client.query(ddl)
    }
    configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
    configureCacheRuntime({config: {default: 'memory', drivers: {memory: {driver: 'memory'}}}})
    storage('https://pub.example.com')
    const uuid = 'f5eb6da0-2dfc-4730-885f-e8390fc3418e'
    const seed = {...source.media[0], id: 1, uuid, path: `media/${uuid}/original/test.webp`, generated_conversions: {optimized: {path: `media/${uuid}/conversions/optimized.webp`}}}
    await DB.table('media').insert({...seed, disk: 's3', conversions_disk: 's3', generated_conversions: JSON.stringify({optimized: {...seed.generated_conversions.optimized, disk: 's3'}})})
    const entity = await Media.findOrFail(seed.id)
    const item = new MediaItem(entity as unknown as ConstructorParameters<typeof MediaItem>[0])
    const url = item.getUrl('optimized')!
    const path = item.getPath('optimized')!
    const missingConversion = `/media/${uuid}/conversions/gallery.webp`
    assert.equal(await resolveMediaReferences(missingConversion), item.getUrl())
    assert.equal(await storeMediaPaths(missingConversion), item.getPath())
    const settings = structuredClone(source.website_settings.find(row => row.setting_key === 'website')!.value) as unknown as WebsiteSettings
    settings.socialImage = url
    await persistWebsiteSettings(settings)
    const saved = (await DB.table('website_settings').where('setting_key', 'website').first())!.value as WebsiteSettings
    assert.equal(saved.socialImage, path)
    assert.equal((await getWebsiteSettings()).socialImage, url)
    storage('https://media.example.com')
    assert.equal((await getWebsiteSettings()).socialImage, item.getUrl('optimized'))
    assert.equal(((await DB.table('website_settings').where('setting_key', 'website').first())!.value as WebsiteSettings).socialImage, path)
    const asset = source.media[0]
    await DB.table('media').insert({...asset, id: 2, disk: 's3', generated_conversions: JSON.stringify({})})
    assert.equal((await resolveMediaReferences({image: '/' + asset.path})).image, `https://media.example.com/${asset.path.split('/').map(encodeURIComponent).join('/')}`)
    assert.equal(await storeMediaPaths(`https://external.example.com/${asset.path}`), `https://external.example.com/${asset.path}`)
    assert.equal(await storeMediaPaths(`https://media.example.com/${asset.path.split('/').map(encodeURIComponent).join('/')}`), '/' + asset.path)
    const nested = {hero: url, body: {attrs: {src: item.getUrl()!}}, external: 'https://other.example.com/photo.webp', local: '/assets/logo.svg', source: url}
    const stored = await storeMediaPaths(nested)
    assert.equal(stored.hero, item.getPath('optimized'))
    assert.equal(stored.body.attrs.src, item.getPath())
    assert.equal(stored.external, nested.external)
    assert.equal(stored.local, nested.local)
    assert.equal(stored.source, nested.source)
    const resolved = await resolveMediaReferences(stored)
    assert.equal(resolved.hero, item.getUrl('optimized'))
    assert.equal(resolved.body.attrs.src, item.getUrl())
    await MediaSeeder.run()
    const count = await DB.table('media').count()
    assert.equal(Number(count), source.media.length + 1)
    assert.equal(Number(await DB.table('media').where('disk', 'r2').count()), source.media.length - 1)
    await MediaSeeder.run()
    assert.equal(await DB.table('media').count(), count)
  } finally {
    resetStorageRuntime()
    resetCacheRuntime()
    resetDB()
    await client.end()
  }
})
