import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {renderToStaticMarkup} from 'react-dom/server'
import {createPaginator} from '@holo-js/db'
import {CrudPagination} from '../components/admin/crud-pagination'
import {CrudList} from '../components/admin/crud-list'

const pagination={meta:createPaginator([], {total:0,perPage:25,currentPage:1,lastPage:1,pageName:'page',from:null,to:null,hasMorePages:false}).meta,query:'',filters:{}}

test('CRUD consumers cannot assemble separate table controls',()=>{
 for(const file of ['crud-index','application-manager','enquiry-manager']){
  const source=readFileSync(`components/admin/${file}.tsx`,'utf8')
  assert.match(source,/<CrudList\b/,file)
  assert.doesNotMatch(source,/<(?:CatalogTable|CatalogRowActions|CatalogList|CatalogIconLink)\b/,file)
 }
})
test('Read-only rows have search and correctly spanning empty cells without mutation controls',()=>{
 const html=renderToStaticMarkup(<CrudList pagination={pagination} title="Applications" section="Recruitment" description="Review submissions." columns={['Name','Status']} rows={[]} empty="No submissions yet."/>)
 assert.match(html,/type="search"/)
 assert.match(html,/colSpan="2"|colspan="2"/)
 assert.match(html,/No submissions yet/)
 assert.doesNotMatch(html,/Delete|Add application|Edit application/)
})
test('Permitted row controls and confirmation use the shared button system',()=>{
 const html=renderToStaticMarkup(<CrudList pagination={pagination} title="Jobs" section="Recruitment" description="Manage jobs." columns={['Name']} rows={[{id:1,name:'Quality',cells:['Quality'],editHref:'/admin/careers/1/edit',deletion:{description:'Remove this job.',onConfirm:()=>{}}}]} empty="No jobs."/>)
 assert.match(html,/aria-label="Edit Quality"/)
 assert.match(html,/aria-label="Delete Quality"/)
 assert.match(html,/catalog-button-danger/)
 assert.doesNotMatch(html,/admin-confirm-delete|admin-confirm-cancel/)
})

test('CRUD renders server results without filtering the current page again', () => {
 const html=renderToStaticMarkup(<CrudList pagination={{...pagination,query:'different',meta:{...pagination.meta,total:51,lastPage:3,hasMorePages:true}}} title="Jobs" section="Recruitment" description="Manage jobs." columns={['Name']} rows={[{id:1,name:'Quality',cells:['Quality']}]} empty="No jobs."/>)
 assert.match(html,/Quality/)
 assert.match(html,/51 records/)
 assert.match(html,/aria-label="Page 3"/)
 assert.match(html,/aria-current="page"/)
 assert.match(html,/Results per page/)
 assert.match(html,/q=different(?:&amp;|&)page=2/)
})

test('Pagination footer is hidden for empty and single-page results', () => {
 for (const total of [0, 14, 25]) {
  const html = renderToStaticMarkup(<CrudPagination meta={{...pagination.meta, total, to: total || null}} href={page => `?page=${page}`} onPageSizeChange={() => {}}/>)
  assert.equal(html, '')
 }
})
