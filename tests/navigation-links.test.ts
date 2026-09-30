import assert from 'node:assert/strict'
import {test} from 'node:test'
import {removeInternalNavigationLinks} from '../lib/cms/navigation-links'
import seed from '../server/db/seed-data/site-content.json'
import snapshot from '../server/db/seed-data/managed-content-snapshot.json'

test('fixed internal destinations are removed while external contacts, media and editorial hyperlinks remain',()=>{
  const link=(source:string,value=source)=>({source,value})
  const editorial={type:'text',text:'Read more',marks:[{type:'link',attrs:{href:'/downloads'}}]}
  const content={sections:[{texts:[{values:{en:'Back to home'}}],links:[link('/index'),link('#details'),link('news'),link('/contact','https://example.com'),link('https://example.com','/contact'),link('https://example.com'),link('mailto:sales@example.com'),link('tel:+20100'),link('/storage/profile.pdf')],body:[editorial]}]}
  const cleaned=removeInternalNavigationLinks(content)
  assert.deepEqual(cleaned.sections[0].links,[link('https://example.com'),link('mailto:sales@example.com'),link('tel:+20100'),link('/storage/profile.pdf')])
  assert.deepEqual(cleaned.sections[0].texts,content.sections[0].texts)
  assert.deepEqual(cleaned.sections[0].body,[editorial])
  assert.equal(content.sections[0].links.length,9)
})

test('fresh seed data contains no fixed internal navigation fields',()=>{
  for(const content of [seed,snapshot])assert.deepEqual(removeInternalNavigationLinks(content),content)
})

test('saving content from an old admin screen cannot restore fixed internal destinations',()=>{
  const content={links:[{source:'/contact',value:'/privacy'}]}
  assert.deepEqual(removeInternalNavigationLinks(content),{links:[]})
  assert.deepEqual(removeInternalNavigationLinks(removeInternalNavigationLinks(content)),{links:[]})
})
