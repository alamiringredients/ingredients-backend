import '../.holo-js/generated/schema.generated'
import {Media} from '@holo-js/media'
import {configureStorageRuntime, resetStorageRuntime} from '@holo-js/storage/runtime'
import {getPdfFileSizes} from '../server/services/downloads/file-sizes'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {loadEnvFile} from 'node:process'
import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createConnection} from 'mysql2/promise'
import {createMySQLAdapter} from '@holo-js/db-mysql'
import {configureDB, createConnectionManager, createDialect, resetDB, createSeederService, DB} from '@holo-js/db'
import {configureCacheRuntime, resetCacheRuntime} from '@holo-js/cache'
import Certification from '../server/models/Certification'
import CertificationType from '../server/models/CertificationType'
import HomeSection from '../server/models/HomeSection'
import WebsiteSetting from '../server/models/WebsiteSetting'
import Product from '../server/models/Product'
import ProductCategory from '../server/models/ProductCategory'
import Admin from '../server/models/Admin'
import Role from '../server/models/Role'
import User from '../server/models/User'
import ContentTranslation from '../server/models/ContentTranslation'
import {getTranslationCatalog} from '../lib/translation-catalog'
import {getCertifications} from '../server/services/certifications/content'
import {getHomeCmsData} from '../server/services/cms/content'
import {getDownloadsPageContent} from '../server/services/downloads/content'
import {getQualityPageContent} from '../server/services/quality/content'
import {downloadableCertifications} from '../lib/certifications/contracts'
import NewsRevision from '../server/models/NewsRevision'
import NewsArticle from '../server/models/NewsArticle'
import type {NewsContent} from '../lib/news/contracts'
import NewsSeeder from '../server/db/seeders/NewsSeeder'
import DatabaseSeeder from '../server/db/seeders/DatabaseSeeder'
import RolesSeeder from '../server/db/seeders/RolesSeeder'
import AdminSeeder from '../server/db/seeders/AdminSeeder'
import UserSeeder from '../server/db/seeders/UserSeeder'
import HomePageSeeder from '../server/db/seeders/HomePageSeeder'
import WebsiteSettingsSeeder from '../server/db/seeders/WebsiteSettingsSeeder'
import DownloadsPageSeeder from '../server/db/seeders/DownloadsPageSeeder'
import QualityPageSeeder from '../server/db/seeders/QualityPageSeeder'
import ProductCatalogSeeder from '../server/db/seeders/ProductCatalogSeeder'
import CertificationSeeder from '../server/db/seeders/CertificationSeeder'
import ContentTranslationSeeder from '../server/db/seeders/ContentTranslationSeeder'
import ManagedPagesSeeder from '../server/db/seeders/ManagedPagesSeeder'
import EventSeeder from '../server/db/seeders/EventSeeder'
import SustainabilitySeeder from '../server/db/seeders/SustainabilitySeeder'
import CareersAboutSeeder from '../server/db/seeders/CareersAboutSeeder'
import Event from '../server/models/Event'
import CareerJob from '../server/models/CareerJob'
import SustainabilityArticle from '../server/models/SustainabilityArticle'

const decode = <T,>(value: unknown): T => (typeof value === 'string' ? JSON.parse(value) : value) as T
// Temporary tables shadow the real tables only on this connection.
test('database bootstrap and certification cache work against MySQL without changing saved site data', async t => {
  loadEnvFile('.env')
  const client = await createConnection({host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USERNAME || 'root', password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE || 'alamir'})
  const directory = await mkdtemp(join(tmpdir(), 'alamir-certifications-test-'))
  try {
    for (const table of ['certification_types', 'certifications', 'home_sections', 'website_settings', 'products', 'product_categories', 'admins', 'roles', 'users', 'content_translations', 'translation_seed_keys', 'media', 'news_articles', 'news_taxonomies', 'news_revisions', 'events', 'event_slots', 'sustainability_articles', 'career_jobs']) {
      const [rows] = await client.query(`SHOW CREATE TABLE \`${table}\``)
      const ddl = (rows as Array<{'Create Table': string}>)[0]['Create Table'].replace('CREATE TABLE', 'CREATE TEMPORARY TABLE').split('\n').filter(line => !line.trimStart().startsWith('CONSTRAINT ')).join('\n').replace(/,\n\)/, '\n)')
      await client.query(ddl)
    }
    configureDB(createConnectionManager({defaultConnection: 'main', connections: {main: {adapter: createMySQLAdapter({client}), dialect: createDialect('mysql'), driver: 'mysql'}}}))
    configureCacheRuntime({config: {default: 'file', drivers: {file: {driver: 'file', path: directory}}}})
    const seeders = createSeederService(DB.connection(), [DatabaseSeeder, RolesSeeder, AdminSeeder, UserSeeder, HomePageSeeder, WebsiteSettingsSeeder, DownloadsPageSeeder, QualityPageSeeder, ManagedPagesSeeder, EventSeeder, ProductCatalogSeeder, CertificationSeeder, NewsSeeder, SustainabilitySeeder, CareersAboutSeeder, ContentTranslationSeeder])
    await seeders.seed({only: ['database']})
    await t.test('every implemented dashboard has seed coverage', async () => {
      assert.equal((await NewsArticle.getJson()).length, 9)
      assert.equal((await CertificationType.getJson()).length, 14)
      assert.equal((await Certification.getJson()).length, 18)
      assert.equal((await ProductCategory.getJson()).length, 4)
      assert.equal((await Product.getJson()).length, 14)
      assert.equal((await HomeSection.getJson()).length, 13)
      assert.equal((await WebsiteSetting.getJson()).length, 19)
      assert.equal((await Event.getJson()).length, 7)
      assert.equal((await SustainabilityArticle.getJson()).length, 6)
      assert.equal((await CareerJob.getJson()).length, 5)
      assert.equal((await Admin.getJson()).length, 1)
      assert.equal((await Role.getJson()).length, 1)
      assert.deepEqual(decode<Record<string, string[]>>((await Role.getJson())[0].permissions).downloads_page, ['view', 'create', 'edit', 'delete'])
      assert.deepEqual(decode<Record<string, string[]>>((await Role.getJson())[0].permissions).quality_page, ['view', 'create', 'edit', 'delete'])
      assert.equal((await User.getJson()).length, 1)
      assert.ok((await ContentTranslation.getJson()).length > 0)
    })
    await t.test('revision retention keeps the newest ten per article and preserves other articles',async()=>{
      const [first,second]=await NewsArticle.getJson()
      const ids:number[]=[]
      for(let n=0;n<13;n++)ids.push(Number((await NewsRevision.create({article_id:Number(first.id),content:decode<NewsContent>(first.content)})).id))
      const other=await NewsRevision.create({article_id:Number(second.id),content:decode<NewsContent>(second.content)})
      await DB.transaction(async()=>{await NewsArticle.findOrFail(Number(first.id));const latest=await NewsRevision.where('article_id',Number(first.id)).orderBy('id','desc').limit(10).get();await NewsRevision.where('article_id',Number(first.id)).where('id','<',latest.at(-1)!.id).delete()})
      assert.deepEqual((await NewsRevision.where('article_id',Number(first.id)).orderBy('id').getJson()).map(r=>Number(r.id)),ids.slice(-10))
      assert.ok(await NewsRevision.where('id',Number(other.id)).firstJson())
      await DB.transaction(async()=>{await NewsArticle.findOrFail(Number(first.id));await NewsRevision.create({article_id:Number(first.id),content:decode<NewsContent>(first.content)});const latest=await NewsRevision.where('article_id',Number(first.id)).orderBy('id','desc').limit(10).get();await NewsRevision.where('article_id',Number(first.id)).where('id','<',latest.at(-1)!.id).delete()})
      const kept=await NewsRevision.where('article_id',Number(first.id)).orderBy('id').getJson()
      assert.equal(kept.length,10)
      assert.equal(Number(kept[0].id),ids[4])
    })
    const data = await getCertifications(true)
    const type = data.types[0]
    const record = data.certifications.find(record => record.type_id === type.id)!
    await t.test('type, status, file and publication edits invalidate already cached results', async () => {
      await (await CertificationType.findOrFail(type.id)).update({slug: 'edited-shared-type', content: {...type.content, name: {en: 'Updated credential', ar: 'اعتماد معدل', fr: 'Accréditation modifiée'}}})
      assert.equal((await getCertifications()).types.find(item => item.id === type.id)?.content.name.en, 'Updated credential')
      await (await Certification.findOrFail(record.id)).update({content: {...record.content, document: '/test-certificate.pdf'}})
      assert.equal(downloadableCertifications(await getCertifications()).length, 1)
      await (await Certification.findOrFail(record.id)).update({published: false})
      assert.equal(downloadableCertifications(await getCertifications()).length, 0)
      assert.equal((await getCertifications()).certifications.length, 17)
      assert.equal((await getCertifications(true)).certifications.length, 18)
    })
    await t.test('root seeder reruns preserve edits and do not duplicate records or reset credentials', async () => {
      const section = (await getHomeCmsData()).sections.find(section => section.key === 'certifications')!
      section.texts[0].values.en = 'Edited homepage heading'
      await (await HomeSection.where('section_key', 'certifications').first())!.update({content: section})
      const product = (await Product.getJson())[0]
      const category = (await ProductCategory.getJson())[0]
      const admin = (await Admin.getJson())[0]
      await (await Product.findOrFail(Number(product.id))).update({slug: 'edited-product'})
      await (await ProductCategory.findOrFail(Number(category.id))).update({slug: 'edited-category'})
      await (await Admin.findOrFail(Number(admin.id))).update({password: 'test-password-must-not-be-reset'})
      const settings = (await WebsiteSetting.where('setting_key', 'website').firstJson())!
      await (await WebsiteSetting.findOrFail(Number(settings.id))).update({value: {...decode<Record<string, unknown>>(settings.value), companyProfile: {en: '/profile.pdf', ar: '', fr: ''}}})
      const downloads = (await WebsiteSetting.where('setting_key', 'downloads').firstJson())!
      await (await WebsiteSetting.findOrFail(Number(downloads.id))).update({value: {...decode<Record<string, unknown>>(downloads.value), heroTitle: {en: 'Edited downloads hero', ar: 'عنوان معدل', fr: 'Titre modifié'}}})
      const quality = (await WebsiteSetting.where('setting_key', 'quality').firstJson())!
      const qualityValue = decode<{hero:{kicker:{en:string}}}>(quality.value)
      qualityValue.hero.kicker.en = 'Edited quality eyebrow'
      await (await WebsiteSetting.findOrFail(Number(quality.id))).update({value: qualityValue})
      const translation = (await ContentTranslation.getJson())[0]
      await (await ContentTranslation.findOrFail(Number(translation.id))).update({fr: 'Traduction conservée'})
      await seeders.seed({only: ['database']})
      assert.equal((await CertificationType.getJson()).length, 14)
      assert.equal((await Certification.getJson()).length, 18)
      assert.equal((await getCertifications(true)).types.find(item => item.id === type.id)?.slug, 'edited-shared-type')
      assert.equal((await getCertifications(true)).certifications.find(item => item.id === record.id)?.published, false)
      assert.equal((await getHomeCmsData()).sections.find(section => section.key === 'certifications')?.texts[0].values.en, 'Edited homepage heading')
      assert.equal((await Product.where('id', Number(product.id)).firstJson())?.slug, 'edited-product')
      assert.equal((await ProductCategory.where('id', Number(category.id)).firstJson())?.slug, 'edited-category')
      const [adminRows] = await client.query('SELECT password FROM admins WHERE id = ?', [admin.id])
      assert.equal((adminRows as Array<{password: string}>)[0].password, 'test-password-must-not-be-reset')
      assert.equal(decode<{companyProfile: {en: string}}>((await WebsiteSetting.where('setting_key', 'website').firstJson())?.value).companyProfile.en, '/profile.pdf')
      assert.equal((await getDownloadsPageContent()).heroTitle.en, 'Edited downloads hero')
      assert.equal((await getQualityPageContent()).hero.kicker.en, 'Edited quality eyebrow')
      assert.equal((await ContentTranslation.where('id', Number(translation.id)).firstJson())?.fr, 'Traduction conservée')
    })
    await t.test('translation seeding removes retired credential rows and does not recreate them', async () => {
      await ContentTranslation.create({translation_key: 'quality.retired-test', page: 'quality', source: 'HACCP', en: 'HACCP', ar: 'HACCP', fr: 'HACCP'})
      await seeders.seed({only: ['content_translations']})
      assert.equal(await ContentTranslation.where('page', 'quality').where('source', 'HACCP').firstJson(), undefined)
      await seeders.seed({only: ['content_translations']})
      assert.equal(await ContentTranslation.where('page', 'quality').where('source', 'HACCP').firstJson(), undefined)
      assert.equal(await ContentTranslation.where('page', 'quality').where('source', 'Technology').firstJson(), undefined)
      assert.ok(await ContentTranslation.where('page', 'certification-interface').where('source', 'Target').firstJson())
    })
    await t.test('PDF byte counts follow the referenced media file and its replacement', async () => {
      configureStorageRuntime({getRuntimeConfig: () => ({holoStorage: {defaultDisk: 'public', diskNames: ['public'], routePrefix: '/storage', disks: {public: {name: 'public', driver: 'public', visibility: 'public', root: directory, url: '/storage'}}}}), getStorage: () => ({getItem: async () => null, getItemRaw: async () => null, setItem: async () => {}, setItemRaw: async () => {}, hasItem: async () => false, removeItem: async () => {}, getKeys: async () => []})})
      const media = await Media.create({uuid: '8cbe17c0-9e5f-4ad4-a72a-7af32810ce9f', model_type: 'certifications', model_id: String(record.id), collection_name: 'files', name: 'Certificate', file_name: 'certificate.pdf', disk: 'public', mime_type: 'application/pdf', extension: 'pdf', size: 1536, path: 'certificates/certificate.pdf', generated_conversions: {}, order_column: 1})
      assert.deepEqual(await getPdfFileSizes(['/storage/certificates/certificate.pdf', 'https://example.test/unknown.pdf']), {'/storage/certificates/certificate.pdf': 1536})
      await media.update({size: 2621440})
      assert.equal((await getPdfFileSizes(['/storage/certificates/certificate.pdf']))['/storage/certificates/certificate.pdf'], 2621440)
      assert.deepEqual(await getPdfFileSizes(['/storage/certificates/replacement.pdf']), {})
      const assets = await mkdtemp(join(process.cwd(), 'public/assets/pdf-size-test-'))
      try {
        const file = join(assets, 'document.pdf')
        const url = file.slice(join(process.cwd(), 'public').length)
        await writeFile(file, Buffer.alloc(2048))
        assert.equal((await getPdfFileSizes([url]))[url], 2048)
        await writeFile(file, Buffer.alloc(4096))
        assert.equal((await getPdfFileSizes([url]))[url], 4096)
        assert.deepEqual(await getPdfFileSizes(['/assets/nonexistent-test.pdf', '/assets/../../package.json']), {})
      } finally {await rm(assets, {recursive: true, force: true})}
    })
    await t.test('deleted translations stay absent from every page after standalone and full seeds', async () => {
      const rows = await ContentTranslation.getJson()
      const removed = [...new Map(rows.map(row => [String(row.page), row])).values()]
      assert.ok(removed.length > 10)
      // Direct SQL deletion also needs to be respected, without model hooks.
      for (const row of removed) await client.query('DELETE FROM content_translations WHERE id = ?', [row.id])
      const assertAbsent = async () => {
        const stored = new Set((await ContentTranslation.getJson()).map(row => String(row.translation_key)))
        const visible = new Set((await getTranslationCatalog()).map(row => row.key))
        for (const row of removed) {
          assert.equal(stored.has(String(row.translation_key)), false, String(row.page))
          assert.equal(visible.has(String(row.translation_key)), false, String(row.page))
        }
        assert.equal(stored.size, rows.length - removed.length)
      }
      await assertAbsent()
      await seeders.seed({only: ['content_translations']})
      await assertAbsent()
      await seeders.seed({only: ['database']})
      await assertAbsent()
    })
    await t.test('deleting a certification updates cached public lists', async () => {
      const before = (await getCertifications(true)).certifications.length
      await (await Certification.findOrFail(record.id)).delete()
      assert.equal((await getCertifications(true)).certifications.length, before - 1)
    })
  } finally {
    resetStorageRuntime()
    resetCacheRuntime()
    resetDB()
    await client.end()
    await rm(directory, {recursive: true, force: true})
  }
})
