import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createConnection} from 'mysql2/promise'
import {configureDB, createConnectionManager, createDialect, DB, resetDB} from '@holo-js/db'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import cache, {configureCacheRuntime, resetCacheRuntime} from '@holo-js/cache'
import {configureStorageRuntime, resetStorageRuntime} from '@holo-js/storage/runtime'
import createS3Driver from '@holo-js/storage-s3'
import source from '../server/db/seed-data/site-content.json'
import {contentCacheKeyForPage} from '../server/support/cache-keys'
import {payload} from '../server/http/controllers/public/download-controller'

test('downloads returns R2 PDF sizes without a local assets directory', async () => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME || 'root', password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE})
  const cwd = process.cwd()
  const directory = await mkdtemp(join(tmpdir(), 'alamir-downloads-'))
  try {
    const [tables] = await client.query('SHOW CREATE TABLE media')
    await client.query((tables as Array<{'Create Table': string}>)[0]['Create Table'].replace('CREATE TABLE', 'CREATE TEMPORARY TABLE'))
    configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
    configureCacheRuntime({config: {default: 'memory', drivers: {memory: {driver: 'memory'}}}})
    const options = {accessKeyId: 'test', secretAccessKey: 'test', endpoint: 'https://example.com', region: 'auto', bucket: 'test'}
    const backend = createS3Driver(options)
    configureStorageRuntime({
      getRuntimeConfig: () => ({holoStorage: {defaultDisk: 'r2', diskNames: ['r2'], routePrefix: '/storage', disks: {r2: {...options, name: 'r2', driver: 's3', visibility: 'public', url: 'https://media.example.com'}}}}),
      getStorage: () => backend,
    })
    const uuid = 'f5eb6da0-2dfc-4730-885f-e8390fc3418e'
    const path = `media/${uuid}/original/profile.pdf`
    await DB.table('media').insert({...source.media[0], uuid, disk: 'r2', path, file_name: 'profile.pdf', extension: 'pdf', mime_type: 'application/pdf', size: 2048, generated_conversions: JSON.stringify({})})
    const settings = structuredClone(source.website_settings.find(row => row.setting_key === 'website')!.value)
    settings.companyProfile = {en: '/' + path, ar: '', fr: ''}
    await cache.rememberForever(contentCacheKeyForPage('downloads', 'en'), async () => ({
      content: source.website_settings.find(row => row.setting_key === 'downloads')!.value,
      settings,
      catalog: {categories: [], products: [], settings: {}},
      certifications: {certifications: [], types: []},
      labels: {},
    }))
    process.chdir(directory)
    const response = await payload(new Request('http://localhost/api/v1/public/downloads/payload?locale=en'))
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.deepEqual(body.data.fileSizes, {[`https://media.example.com/${path}`]: 2048})
  } finally {
    process.chdir(cwd)
    resetStorageRuntime()
    resetCacheRuntime()
    resetDB()
    await client.end()
    await rm(directory, {recursive: true, force: true})
  }
})
