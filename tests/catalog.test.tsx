import assert from 'node:assert/strict'
import {test} from 'node:test'
import {productHeroImage} from '../lib/catalog/contracts'
import {newCatalogRecord} from '../lib/catalog/new-record'
import {applyCatalogTranslations} from '../lib/catalog/translations'
import {safeUrl,validateArtworkBlock,validateBlock} from '../lib/catalog/validation'
import {getCatalogSeedContent} from '../server/db/seed-data/catalog-seed-content'
import {getCatalogSeedTranslationDefinitions} from '../server/db/seed-data/catalog-translation-definitions'

test('catalog seed includes every localized category and product',()=>{
  const catalog=getCatalogSeedContent()
  assert.equal(catalog.categories.length,4)
  assert.equal(catalog.products.length,14)
  for(const product of catalog.products){
    assert.match(product.content.seedKey??'',/^[a-z-]+\/[a-z-]+$/)
    for(const locale of ['en','ar','fr'] as const)assert.ok(product.content.name[locale])
    assert.ok(product.content.page.blocks.some(block=>block.label==='Product overview'))
    assert.equal(product.content.gallery.length,6)
    assert.equal(productHeroImage(product),product.content.gallery[0].image)
    assert.ok(product.content.gallery.every(item=>item.image.endsWith('.webp')&&item.caption.en))
    assert.deepEqual(product.content.tds,{en:'',ar:'',fr:''})
  }
})

test('catalog translations follow stable source text',()=>{
  const catalog=getCatalogSeedContent(),stored=structuredClone(catalog)
  const field=stored.settings.blocks[2].texts.find(item=>item.source==='Certification marks')!
  field.id='old-field-id'
  const rows=getCatalogSeedTranslationDefinitions().map(entry=>({translation_key:entry.key,source:entry.source,...entry.translations}))
  const translated=applyCatalogTranslations(stored,rows)
  assert.equal(translated.settings.blocks[2].texts.find(item=>item.source==='Certification marks')?.values.fr,'Marques de certification')
})

test('catalog validation protects executable links',()=>{
  const catalog=getCatalogSeedContent(),block=catalog.products[0].content.page.blocks[0]
  assert.doesNotThrow(()=>validateBlock(block,block))
  for(const value of ['javascript:alert(1)','//evil.test/file','/\\evil.test/file'])assert.throws(()=>safeUrl(value))
  assert.equal(safeUrl('/storage/catalog/file.pdf'),'/storage/catalog/file.pdf')
})

test('category artwork accepts no more than six images',()=>{
  const catalog=getCatalogSeedContent(),artwork=catalog.categories[0].content.artwork
  assert.doesNotThrow(()=>validateArtworkBlock(artwork,artwork))
  assert.throws(()=>validateArtworkBlock({...artwork,assets:Array.from({length:7},(_,index)=>({...artwork.assets[0],id:`asset-${index}`}))},artwork))
})

test('new catalog records are detached from seed content',()=>{
  const catalog=getCatalogSeedContent(),before=structuredClone(catalog.products[0])
  const product=newCatalogRecord('product',catalog.products[0])
  product.slug='changed'
  product.content.name.en='Changed'
  assert.deepEqual(catalog.products[0],before)
  assert.equal(product.id,0)
})
