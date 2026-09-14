import assert from 'node:assert/strict'
import test from 'node:test'
import {documentHeadings,validateDocument} from '@/lib/editor/document'

test('editor block layout and visibility choices survive validation',()=>{
  const document=validateDocument({type:'doc',content:[
    {type:'columns',attrs:{layout:'prose-media',verticalAlign:'center',visible:true},content:[
      {type:'column',content:[{type:'paragraph',attrs:{visible:true},content:[{type:'text',text:'Copy'}]}]},
      {type:'column',content:[{type:'image',attrs:{src:'/image.webp',alt:'Image',caption:'Caption',captionPosition:'above',visible:false}}]},
    ]},
  ]})
  const columns=document.content[0]
  assert.equal(columns.attrs?.layout,'prose-media')
  assert.equal(columns.attrs?.verticalAlign,'center')
  assert.equal(columns.attrs?.visible,true)
  assert.equal(columns.content?.[1].content?.[0].attrs?.captionPosition,'above')
  assert.equal(columns.content?.[1].content?.[0].attrs?.visible,false)
})

test('headings inside hidden blocks stay out of generated contents',()=>{
  const document=validateDocument({type:'doc',content:[
    {type:'contentSection',attrs:{id:'hidden',goals:[],visible:false},content:[{type:'heading',attrs:{id:'hidden-title',level:2},content:[{type:'text',text:'Hidden title'}]}]},
    {type:'heading',attrs:{id:'shown-title',level:2,visible:true},content:[{type:'text',text:'Shown title'}]},
  ]})
  assert.deepEqual(documentHeadings(document),[{id:'shown-title',text:'Shown title',level:2}])
})

test('action groups preserve link appearance and per-link visibility',()=>{
  const document=validateDocument({type:'doc',content:[
    {type:'actions',attrs:{visible:true,items:[
      {label:'Explore our products',href:'/products',variant:'primary',visible:true},
      {label:'Request a quote',href:'/contact',variant:'secondary',visible:false},
    ]}},
  ]})
  assert.deepEqual(document.content[0].attrs,{visible:true,items:[
    {label:'Explore our products',href:'/products',variant:'primary',visible:true},
    {label:'Request a quote',href:'/contact',variant:'secondary',visible:false},
  ]})
})

test('video blocks preserve their named caption treatment',()=>{
  const document=validateDocument({type:'doc',content:[
    {type:'video',attrs:{src:'/video.mp4',caption:'A ledger caption',captionStyle:'ledger'}},
  ]})
  assert.equal(document.content[0].attrs?.captionStyle,'ledger')
})

test('statistics blocks preserve their complete header row',()=>{
  const document=validateDocument({type:'doc',content:[
    {type:'textStatistics',attrs:{label:'Al Amir Group at a glance',markSrc:'/assets/logo-group-mark.webp',markAlt:'Alamir Group',markHref:'https://www.alamireg.com/',items:[{value:'50+years',label:'Of agricultural trading'}]}},
  ]})
  assert.deepEqual(document.content[0].attrs,{
    label:'Al Amir Group at a glance',
    markSrc:'/assets/logo-group-mark.webp',
    markAlt:'Alamir Group',
    markHref:'https://www.alamireg.com/',
    items:[{value:'50+years',label:'Of agricultural trading'}],
    visible:true,
  })
})
