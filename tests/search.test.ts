import assert from 'node:assert/strict'
import {test} from 'node:test'
import {searchResults,searchableText,type SearchResult} from '../lib/search/match'
const records:SearchResult[]=[
  {href:'/products/hot-break',title:'Hot break tomato',description:'28–30 °Bx',section:'Products',text:'Brix ketchup'},
  {href:'/quality',title:'FSSC 22000',description:'Certification',section:'Quality',text:'food safety'},
  {href:'/ar/products',title:'مركزات الطماطم',description:'',section:'',text:''},
  {href:'/fr/products',title:'Purée de pêche',description:'',section:'',text:''},
]
test('search excludes unrelated samples and requires all query terms',()=>{
  assert.deepEqual(searchResults(records,'whatever'),[])
  assert.deepEqual(searchResults(records,'  '),[])
  assert.deepEqual(searchResults(records,'hot break Brix').map(r=>r.href),['/products/hot-break'])
  assert.deepEqual(searchResults(records,'FSSC 22000').map(r=>r.href),['/quality'])
  assert.deepEqual(searchResults(records,'hot FSSC'),[])
})
test('search handles Arabic diacritics, French accents and numeric specifications',()=>{
  assert.equal(searchResults(records,'طَمَاطِم')[0].href,'/ar/products')
  assert.equal(searchResults(records,'puree peche')[0].href,'/fr/products')
  assert.equal(searchResults(records,'28 30')[0].href,'/products/hot-break')
})
test('search reads the requested locale and excludes disabled sections and editor metadata',()=>{
  const text=searchableText([{en:'tomato',ar:'طماطم',fr:'tomate'},{enabled:false,texts:[{values:{en:'hidden'}}]},{type:'paragraph',content:[{type:'text',text:'visible'}]},{assets:[{value:'/secret.pdf'}],source:'template'}],'en')
  assert.match(text,/tomato/)
  assert.match(text,/visible/)
  assert.doesNotMatch(text,/طماطم|tomate|hidden|secret|template|paragraph/)
})
